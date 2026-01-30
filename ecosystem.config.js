module.exports = {
  apps: [{
    name: 'nest-backend',
    script: 'dist/main.js',
    instances: 1, // Or 'max' for CPU cluster mode
    exec_mode: 'fork', // Or 'cluster'
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    }
  }]
};
