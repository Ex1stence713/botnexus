export default [
    {
        name: "botnexus",
        script: "index.js",
        cwd: "./",
        node_args: "--experimental-vm-modules",
        instances: 1,
        autorestart: true,
        watch: false,
        max_restarts: 10,
        restart_delay: 5000,
        out_file: "./logs/out.log",
        error_file: "./logs/err.log",
        log_file: "./logs/combined.log",
        merge_logs: true,
        time: true,
        env: {
            NODE_ENV: "production",
        }
    }
];
