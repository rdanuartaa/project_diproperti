<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <title>Diproperti Server | API Backend</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #02469B;
            --primary-light: #3370B8;
            --bg-light: #f8fafc;
            --card-bg: #ffffff;
            --text-dark: #1e293b;
            --text-gray: #64748b;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: var(--bg-light);
            background: radial-gradient(circle at top right, #eef5ff, #f8fafc);
            color: var(--text-dark);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .background-blobs {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: -1;
        }

        .blob {
            position: absolute;
            background: var(--primary);
            filter: blur(80px);
            border-radius: 50%;
            opacity: 0.1;
            animation: move 20s infinite alternate;
        }

        .blob-1 { width: 400px; height: 400px; top: -100px; left: -100px; }
        .blob-2 { width: 300px; height: 300px; bottom: -50px; right: 10%; animation-delay: -5s; }

        @keyframes move {
            from { transform: translate(0, 0) scale(1); }
            to { transform: translate(100px, 50px) scale(1.1); }
        }

        .container {
            width: 90%;
            max-width: 600px;
            padding: 50px 40px;
            background: var(--card-bg);
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 32px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);  
            animation: fadeIn 1s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(to right, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }

        .status {
            display: inline-flex;
            align-items: center;
            padding: 8px 20px;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            color: #16a34a;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 2.5rem;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            background: #22c55e;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        .message {
            font-size: 1.15rem;
            color: var(--text-gray);
            line-height: 1.7;
            margin-bottom: 3rem;
        }

        .highlight {
            color: var(--text-dark);
            font-weight: 600;
            display: block;
            margin-top: 0.75rem;
        }

        .btn {
            display: inline-block;
            padding: 18px 36px;
            background: var(--primary);
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1.05rem;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px -5px rgba(2, 70, 155, 0.3);
        }

        .btn:hover {
            transform: translateY(-3px);
            background: var(--primary-light);
            box-shadow: 0 15px 25px -5px rgba(2, 70, 155, 0.4);
        }

        .footer {
            margin-top: 3.5rem;
            font-size: 0.8rem;
            color: #94a3b8;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="background-blobs">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
    </div>

    <div class="container">
        <div class="logo">Diproperti Server</div>
        
        <div class="status">
            <span class="status-dot"></span>
            Backend API is Running
        </div>

        <p class="message">
            Ups! Ini hanyalah server backend untuk project Diproperti.<br>
            <span class="highlight">Aplikasi utamanya (Frontend) berjalan di:</span>
        </p>

        <a href="http://localhost:3000" class="btn">Buka Localhost:3000</a>

        <div class="footer">
            Laravel v<?php echo e(Illuminate\Foundation\Application::VERSION); ?> (PHP v<?php echo e(PHP_VERSION); ?>)
        </div>
    </div>
</body>
</html>
<?php /**PATH /var/www/html/resources/views/welcome.blade.php ENDPATH**/ ?>