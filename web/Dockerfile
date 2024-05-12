# Use the latest version of node alpine
FROM node:21-alpine3.18

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies in the container
RUN npm install --force

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD ["npm", "start"]