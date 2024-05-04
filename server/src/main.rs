use saphir::{file::middleware::{FileMiddleware, FileMiddlewareBuilder}, http::{HeaderName, HeaderValue}, prelude::*};
use log::info;

#[tokio::main]
async fn main() -> Result<(), SaphirError> {
    env_logger::init();

    let www_file_middleware = file_middleware("/", "../www")?;
    let wasm_multithread_file_middleware = file_middleware("wasm-multithread", "../wasm-multithread/pkg")?;

    let port = 3000;
    let server = Server::builder()
        .configure_listener(|l| l
            .interface(&format!("127.0.0.1:{port}"))
            .server_name("Saphir Wasm Multithread Example Server")
            .request_timeout(None)
        )
        .configure_middlewares(|m| m
            .apply(www_file_middleware, vec!["/"], None)
            .apply(wasm_multithread_file_middleware, vec!["/wasm-multithread/"], None)
            .apply(WasmMultithreadMiddleware::new(), vec!["/wasm-multithread/"], None)
        )
        .build();

    server.run().await
}

fn file_middleware(base_path: &str, www_path: &str) -> Result<FileMiddleware, SaphirError> {
    let mut file_middleware_builder = FileMiddlewareBuilder::new(base_path, www_path);
    #[cfg(debug_assertions)]
    {
        // We disable the build-in file cache for development
        file_middleware_builder = file_middleware_builder.max_capacity(0).max_file_size(0);
        info!("Running with file cache disabled for development...");
    }
    file_middleware_builder.build()
}

struct WasmMultithreadMiddleware
{
    headers: Vec<(HeaderName, HeaderValue)>,
}

#[middleware]
impl WasmMultithreadMiddleware {

    pub fn new() -> Self {
        WasmMultithreadMiddleware {
            headers: Self::build_headers(&vec![
                ("Cross-Origin-Opener-Policy", "same-origin"),
                ("Cross-Origin-Embedder-Policy", "require-corp"),
            ])
        }
    }

    async fn next(&self, ctx: HttpContext, chain: &dyn MiddlewareChain) -> Result<HttpContext, SaphirError> {
        // BEFORE request

        let mut ctx = chain.next(ctx).await?;

        // AFTER request
        let response = ctx.state.response_unchecked_mut();

        for (k, v) in &self.headers {
            response.headers_mut().insert(k, v.clone());
        }

        Ok(ctx)
    }

    fn build_headers(vec: &[(&'static str, &'static str)]) -> Vec<(HeaderName, HeaderValue)> {
        vec.iter()
        .map(|(k, v)| (k.parse().unwrap(), v.parse().unwrap()))
        .collect()
    }
}