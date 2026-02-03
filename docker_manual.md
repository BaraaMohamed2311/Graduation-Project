

```bash
docker buildx build   --platform linux/amd64,linux/arm64 --network=host   -t <image> -f <dockerfile>  --push   .
```