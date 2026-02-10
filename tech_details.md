We assume all specific fields exist when fetching all employees to optimize query without many cases and joins
We cannot set APIKEY dynamically depending on env case (localhost/docker-compose/kubernetes)
- Reason : next uses variables in next conf at build time, and since we import prebuilt image at server we can not rebuild image with correct
url path
- Solutions:
    - Push different prebuilt images for each env, knowing that if you were to just change them you'll need to rebuild entire image
    - Build images with dummy values like ARG NEXT_PUBLIC_BACKEND_API_URL=BAKED_NEXT_PUBLIC_BACKEND_API_URL then use bash script to replace
        it but this has risks of corrupting app if something goes wrong

