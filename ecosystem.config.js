module.exports = {
  apps: [{
    name: 'xword',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3040
    },
    watch: false,
    instances: 1,
    autorestart: true,
  }]
}; 