# Use the official Node.js image.
FROM node:18

# Install TypeScript globally.
RUN npm install -g typescript

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the local code to the container image.
COPY . .

# Compile TypeScript files to JavaScript.
RUN tsc

# Generate Prisma Client
RUN npx prisma generate

# Expose the port the app runs on.
EXPOSE 3000

# Run the web service on container startup.
CMD ["node", "dist/index.js"]