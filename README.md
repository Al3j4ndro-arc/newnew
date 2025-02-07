# Recruitment Platform for the MIT Consulting Group

## Usage

Run `npm run watch` to watch for changes in TailwindCSS classes and compile them into a CSS file.

Make sure docker is installed on your machine. (https://docs.docker.com/get-docker/)

Run `docker build -t mcg-apply .` in the root project directory to build the docker image.

Run `docker run -dp 5000:5000 mcg-apply` to run the docker image.

Once the docker image is running, you can access the website at `localhost:5000`.
