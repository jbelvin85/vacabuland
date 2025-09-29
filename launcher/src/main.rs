use std::env;
use std::fs::{self, File};
use std::io::{self, Cursor, Read};
use std::net::TcpListener;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;
use std::thread;

use serde_json::{Map, Value};
use tiny_http::{Header, Method, Response, Server};

const WORDLISTS_FILENAME: &str = "wordlists.json";

fn main() {
    if let Err(err) = run() {
        eprintln!("Error: {err}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let root_dir = locate_web_root()?;
    println!("Serving content from {}", root_dir.display());

    let (listener, port) = bind_listener()?;
    let server = Server::from_listener(listener, None).map_err(|e| e as Box<dyn std::error::Error>)?;

    let url = format!("http://127.0.0.1:{}/index.html", port);
    println!("Launching browser at {url}");
    if let Err(open_err) = webbrowser::open(&url) {
        eprintln!("Could not launch browser automatically: {open_err}");
        eprintln!("Open this link manually: {url}");
    }

    let root_dir = Arc::new(root_dir);
    let server_thread = {
        let root = Arc::clone(&root_dir);
        thread::spawn(move || serve_forever(server, root))
    };

    if let Err(join_err) = server_thread.join() {
        eprintln!("Server thread exited unexpectedly: {:?}", join_err);
    }

    Ok(())
}

fn bind_listener() -> io::Result<(TcpListener, u16)> {
    let preferred_ports = [4310u16, 4311, 4312];
    for port in preferred_ports {
        match TcpListener::bind(("127.0.0.1", port)) {
            Ok(listener) => {
                println!("Using port {port} for local web server.");
                return Ok((listener, port));
            }
            Err(err) if err.kind() == io::ErrorKind::AddrInUse => continue,
            Err(err) => return Err(err),
        }
    }

    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    let port = listener.local_addr()?.port();
    eprintln!(
        "Warning: default ports unavailable, falling back to random port {port}. Local storage will reset if the port changes between launches."
    );
    Ok((listener, port))
}

fn serve_forever(server: Server, root_dir: Arc<PathBuf>) {
    for mut request in server.incoming_requests() {
        let url_string = request.url().to_string();
        let path_only = request_path(&url_string);

        if path_only == "/api/wordlists" {
            let response = handle_wordlists(&mut request, &root_dir);
            if let Err(err) = request.respond(response) {
                eprintln!("Failed to send response: {err}");
            }
            continue;
        }

        let response = match resolve_candidate_path(&root_dir, path_only) {
            Some(path) => match build_static_response(&path) {
                Ok(response) => response,
                Err(err) => {
                    eprintln!("Failed to serve {}: {}", path.display(), err);
                    build_error_response(500, "Internal Server Error")
                }
            },
            None => build_error_response(404, "Not Found"),
        };

        if let Err(err) = request.respond(response) {
            eprintln!("Failed to send response: {err}");
        }
    }
}

fn request_path(url: &str) -> &str {
    url.split('?').next().unwrap_or(url)
}

fn handle_wordlists(request: &mut tiny_http::Request, root_dir: &Path) -> Response<Cursor<Vec<u8>>> {
    let storage_path = root_dir.join(WORDLISTS_FILENAME);
    match *request.method() {
        Method::Get => {
            let lists = read_wordlists(&storage_path);
            let body = serde_json::to_string_pretty(&lists).unwrap_or_else(|_| "{}".to_string());
            let mut response = Response::from_string(body);
            response.add_header(Header::from_bytes(b"Content-Type", b"application/json").unwrap());
            response.add_header(Header::from_bytes(
                b"Cache-Control",
                b"no-cache, no-store, must-revalidate",
            ).unwrap());
            response
        }
        Method::Post => {
            let mut body = String::new();
            if let Err(err) = request.as_reader().read_to_string(&mut body) {
                return build_error_response(400, &format!("Failed to read request body: {err}"));
            }

            match serde_json::from_str::<Value>(&body) {
                Ok(value) => {
                    let sanitized = sanitize_wordlists(value);
                    if let Value::Object(_) = sanitized {
                        let serialised = serde_json::to_string_pretty(&sanitized).unwrap_or_else(|_| "{}".to_string());
                        if let Err(err) = fs::write(&storage_path, serialised) {
                            return build_error_response(500, &format!("Failed to write word lists: {err}"));
                        }
                        let mut response = Response::from_string("{\"status\":\"ok\"}");
                        response.add_header(Header::from_bytes(b"Content-Type", b"application/json").unwrap());
                        response
                    } else {
                        build_error_response(400, "Word list payload must be an object mapping names to arrays of words.")
                    }
                }
                Err(err) => build_error_response(400, &format!("Invalid JSON: {err}")),
            }
        }
        _ => {
            let mut response = build_error_response(405, "Method Not Allowed");
            response.add_header(Header::from_bytes(b"Allow", b"GET, POST").unwrap());
            response
        }
    }
}

fn sanitize_wordlists(value: Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut cleaned = Map::new();
            for (name, entries) in map {
                if let Value::Array(words) = entries {
                    let filtered: Vec<Value> = words
                        .into_iter()
                        .filter_map(|word| match word {
                            Value::String(s) => {
                                let trimmed = s.trim();
                                if trimmed.is_empty() {
                                    None
                                } else {
                                    Some(Value::String(trimmed.to_string()))
                                }
                            }
                            _ => None,
                        })
                        .collect();
                    if !filtered.is_empty() {
                        cleaned.insert(name, Value::Array(filtered));
                    }
                }
            }
            Value::Object(cleaned)
        }
        _ => Value::Object(Map::new()),
    }
}

fn read_wordlists(path: &Path) -> Value {
    match fs::read_to_string(path) {
        Ok(contents) => sanitize_wordlists(serde_json::from_str(&contents).unwrap_or_else(|_| Value::Object(Map::new()))),
        Err(_) => Value::Object(Map::new()),
    }
}

fn resolve_candidate_path(root: &Path, url_path: &str) -> Option<PathBuf> {
    let clean_path = url_path.trim_start_matches('/');

    let mut candidate = PathBuf::from(root);
    if clean_path.is_empty() {
        candidate.push("index.html");
        return candidate_if_valid(candidate);
    }

    for component in Path::new(clean_path).components() {
        match component {
            Component::Normal(segment) => candidate.push(segment),
            Component::CurDir => {}
            Component::RootDir | Component::ParentDir | Component::Prefix(_) => return None,
        }
    }

    candidate_if_valid(candidate)
}

fn candidate_if_valid(mut path: PathBuf) -> Option<PathBuf> {
    if path.is_file() {
        return Some(path);
    }

    if path.exists() && !path.is_file() {
        path.push("index.html");
        if path.is_file() {
            return Some(path);
        }
    }

    None
}

fn build_static_response(path: &Path) -> io::Result<Response<Cursor<Vec<u8>>>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    let mime = mime_guess::from_path(path).first_raw().unwrap_or("application/octet-stream");
    let mut response = Response::from_data(buffer);
    response.add_header(Header::from_bytes(b"Content-Type", mime.as_bytes()).unwrap());
    response.add_header(Header::from_bytes(
        b"Cache-Control",
        b"no-cache, no-store, must-revalidate",
    ).unwrap());

    Ok(response)
}

fn build_error_response(status_code: u16, message: &str) -> Response<Cursor<Vec<u8>>> {
    let mut response = Response::from_string(message.to_owned());
    response.add_header(
        Header::from_bytes(b"Content-Type", b"text/plain; charset=utf-8").unwrap(),
    );
    response.with_status_code(status_code)
}

fn locate_web_root() -> io::Result<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(current_dir) = env::current_dir() {
        candidates.push(current_dir);
    }

    if let Ok(exe_path) = env::current_exe() {
        let mut maybe_dir = exe_path.parent().map(Path::to_path_buf);
        for _ in 0..6 {
            if let Some(dir) = maybe_dir {
                candidates.push(dir.clone());
                maybe_dir = dir.parent().map(Path::to_path_buf);
            } else {
                break;
            }
        }
    }

    for candidate in candidates {
        if let Ok(dir) = candidate.canonicalize() {
            if dir.join("index.html").is_file() {
                return Ok(dir);
            }
        }
    }

    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "Unable to find index.html near the launcher executable",
    ))
}
