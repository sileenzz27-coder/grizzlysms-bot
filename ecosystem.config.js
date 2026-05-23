module.exports = {
  apps: [
    {
      name: 'GrizzlyBot',
      script: 'index.js',
      cwd: '/Users/silenz/Documents/OFM/BOTS/GrizzlyBot',

      // ✅ REINTENTOS: Reinicia automáticamente si crashea
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',

      // ✅ LOGGING: Guarda todos los logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ✅ MONITOREO: Vigila el proceso
      watch: false,
      ignore_watch: ['node_modules', 'logs'],

      // ✅ ENVIRONMENT: Variables de entorno
      env: {
        NODE_ENV: 'production'
      },

      // ✅ INSTANCIAS: 1 sola instancia (Discord bot no necesita cluster)
      instances: 1,
      exec_mode: 'fork',

      // ✅ GRACEFUL SHUTDOWN: Cierre limpio
      kill_timeout: 5000,
      listen_timeout: 3000,

      // ✅ MECANISMO DE ESPERA: No reinicia demasiado rápido
      exp_backoff_restart_delay: 100,

      // ✅ MONITORIZACION: Detecta si el proceso se queda congelado
      max_memory_restart: '500M'
    }
  ]
};
