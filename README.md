# Parallel Raytracing Saphir

Example of https://rustwasm.github.io/wasm-bindgen/examples/raytrace.html
being served by [saphir](https://docs.rs/saphir)

[View original documentation for this example online][dox]

[dox]: https://rustwasm.github.io/docs/wasm-bindgen/examples/raytrace.html

## Initial Setup
Install wasm-pack
```sh
$ cargo install -f wasm-pack
```

## Build Wasm

```sh
$ cd wasm-multithread
$ wasm-pack build --target no-modules -d ../www/wasm-multithread
```

## Run server
```sh
$ cd server
$ cargo run
```

and then visiting http://localhost:3000 in a browser should run the example!
