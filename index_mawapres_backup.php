<?php
require_once __DIR__ . '/includes/config.php';

try {
    $activePer   = getActivePeriod($pdo);
    $activePerId = $activePer['id'] ?? null;

    if ($activePerId) {
        $stmtRec = $pdo->prepare("SELECT COUNT(*) FROM records WHERE status='approved' AND period_id = ?");
        $stmtRec->execute([$activePerId]);
        $totalRecords = (int)$stmtRec->fetchColumn();

        $stmtNas = $pdo->prepare("SELECT COUNT(*) FROM records WHERE status='approved' AND level='nasional' AND period_id = ?");
        $stmtNas->execute([$activePerId]);
        $totalNasional = (int)$stmtNas->fetchColumn();

        $stmtInter = $pdo->prepare("SELECT COUNT(*) FROM records WHERE status='approved' AND level='internasional' AND period_id = ?");
        $stmtInter->execute([$activePerId]);
        $totalInter = (int)$stmtInter->fetchColumn();
    } else {
        $totalRecords  = (int)$pdo->query("SELECT COUNT(*) FROM records WHERE status='approved'")->fetchColumn();
        $totalNasional = (int)$pdo->query("SELECT COUNT(*) FROM records WHERE status='approved' AND level='nasional'")->fetchColumn();
        $totalInter    = (int)$pdo->query("SELECT COUNT(*) FROM records WHERE status='approved' AND level='internasional'")->fetchColumn();
    }
    $totalStudents = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='user'")->fetchColumn();
    $featured = $pdo->query("SELECT * FROM featured_achievements ORDER BY created_at DESC LIMIT 6")->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $totalRecords = $totalNasional = $totalInter = $totalStudents = 0;
    $featured = [];
}

$pageTitle = 'Mawapres — Mahasiswa Berprestasi UIN Saizu Purwokerto';
$pageDesc  = 'Portal resmi pengarsipan dan pemeringkatan prestasi mahasiswa UIN Prof. K.H. Saifuddin Zuhri Purwokerto. Pengumuman pembukaan seleksi Mahasiswa Award & Mawapres 2026.';
$pageOgImg = BASE_URL . 'assets/Logo%20Mapres%20(1).png';
?>

<!DOCTYPE html>
<html lang="id" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <script>
        document.documentElement.classList.add('gsap-ready');
    </script>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ffffff">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <meta name="description" content="<?= htmlspecialchars($pageDesc) ?>">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= htmlspecialchars($pageTitle) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($pageDesc) ?>">
    <meta property="og:image" content="<?= $pageOgImg ?>">
    <meta property="og:locale" content="id_ID">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($pageTitle) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($pageDesc) ?>">
    <meta name="twitter:image" content="<?= $pageOgImg ?>">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="icon" type="image/png" href="<?= BASE_URL ?>assets/Logo%20Mapres%20(1).png">
    <link rel="apple-touch-icon" href="<?= BASE_URL ?>assets/Logo%20Mapres%20(1).png">

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            --color-primary: #2563eb;
            --color-primary-dark: #1d4ed8;
            --color-primary-light: #60a5fa;
            --color-primary-soft: #eff6ff;
            --color-primary-tint: #dbeafe;
            --color-dark: #0f172a;
            --color-text: #334155;
            --color-text-muted: #64748b;
            --color-border: #e2e8f0;
            --color-border-light: #f1f5f9;
            --color-bg-subtle: #f8fafc;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            color: var(--color-text);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }
        h1, h2, h3, h4 { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            color: var(--color-dark); 
            letter-spacing: -0.03em; 
        }
        a { color: inherit; text-decoration: none; }
        .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }

        /* ================== Site Header (PIONIR Reference Style - Transparent Over Sky) ================== */
        .site-header {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            background: transparent !important;
            border-bottom: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
        }
        .site-header__inner {
            max-width: 1360px;
            margin: 0 auto;
            padding: 14px 32px 0;
        }
        .site-nav {
            display: flex;
            height: 4.2rem;
            align-items: center;
            justify-content: space-between;
        }
        .site-nav__left {
            display: flex;
            align-items: center;
            gap: 2rem;
        }
        .site-nav__brand {
            display: inline-flex;
            align-items: center;
            text-decoration: none;
            gap: 10px;
        }
        .brand-logo-img {
            height: 42px;
            width: auto;
            display: block;
        }
        .brand-text-block {
            line-height: 1.2;
        }
        .brand-main-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
        }
        .brand-sub-title {
            font-size: 0.72rem;
            color: #334155;
            font-weight: 500;
        }
        .site-nav__menu {
            display: none;
            align-items: center;
            gap: 1.8rem;
        }
        @media (min-width: 1024px) {
            .site-nav__menu { display: flex; }
        }
        .site-nav__menu a {
            font-size: 0.88rem;
            font-weight: 600;
            color: #0f172a;
            transition: color 0.15s;
        }
        .site-nav__menu a:hover,
        .site-nav__menu a.active {
            color: #1d4ed8;
        }
        .site-nav__cta {
            display: none;
            align-items: center;
            gap: 0.75rem;
        }
        @media (min-width: 1024px) {
            .site-nav__cta { display: flex; }
        }

        /* PIONIR-Style Header Action Buttons */
        .btn-nav-light {
            background: #ffffff;
            color: #0f172a !important;
            padding: 0.52rem 1.25rem;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.84rem;
            border: 1px solid rgba(15, 23, 42, 0.15);
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.2s ease;
        }
        .btn-nav-light:hover {
            background: #f8fafc;
            transform: translateY(-1px);
        }
        .btn-nav-bell {
            position: relative;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #2563eb;
            color: #ffffff !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.88rem;
            box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
            transition: all 0.2s ease;
            text-decoration: none;
        }
        .btn-nav-bell:hover {
            background: #1d4ed8;
            transform: scale(1.05);
        }
        .bell-dot-alert {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border: 2px solid #ffffff;
            border-radius: 50%;
        }
        .btn-nav-primary {
            background: #1d4ed8;
            color: #ffffff !important;
            padding: 0.52rem 1.35rem;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.84rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
            transition: all 0.2s ease;
        }
        .btn-nav-primary:hover {
            background: #1e40af;
            transform: translateY(-1px);
        }

        /* Mobile Menu */
        .site-nav__toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border-radius: 8px;
            color: var(--color-dark);
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid var(--color-border);
            cursor: pointer;
        }
        @media (min-width: 1024px) { .site-nav__toggle { display: none; } }
        .site-nav__toggle svg { width: 1.25rem; height: 1.25rem; }
        .site-nav__toggle .icon-close { display: none; }
        .site-nav__toggle[aria-expanded="true"] .icon-open { display: none; }
        .site-nav__toggle[aria-expanded="true"] .icon-close { display: block; }
        .site-nav__mobile {
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            border-top: 0 solid var(--color-border);
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 12px;
            margin-top: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .site-nav__mobile.open {
            max-height: 28rem;
            opacity: 1;
            padding: 1rem;
            border: 1px solid var(--color-border);
        }
        .site-nav__mobile-links a {
            display: block;
            padding: 0.75rem 0.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--color-dark);
            border-bottom: 1px solid var(--color-border-light);
        }
        .site-nav__mobile-cta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            padding-top: 1rem;
        }

        /* ================== HERO Mawapres Institutional Landing (PIONIR Layout) ================== */
        .hero {
            position: relative;
            background-color: #8CDDF6;
            overflow: hidden;
        }

        .hero-sky-stage {
            position: relative;
            width: 100%;
            min-height: clamp(580px, 84vh, 740px);
            background-color: #8CDDF6;
            overflow: hidden;
            padding-top: 5.5rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Pixel Clouds (Small, High in the Sky) */
        .pixel-cloud {
            position: absolute;
            pointer-events: none;
            z-index: 1;
            user-select: none;
            line-height: 0;
        }
        .pixel-cloud img {
            display: block;
            height: auto;
            image-rendering: pixelated;
        }
        .cloud-left {
            top: 12%;
            left: 5%;
            width: 135px;
            animation: cloudFloat1 7s ease-in-out infinite alternate;
        }
        .cloud-mid {
            top: 14%;
            left: 36%;
            width: 105px;
            animation: cloudFloat2 9s ease-in-out infinite alternate;
        }
        .cloud-right {
            top: 11%;
            right: 6%;
            width: 145px;
            animation: cloudFloat1 8s ease-in-out infinite alternate;
        }

        @keyframes cloudFloat1 {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-6px); }
        }
        @keyframes cloudFloat2 {
            0% { transform: translateY(-2px) translateX(0px); }
            100% { transform: translateY(4px) translateX(5px); }
        }

        /* Center Arch / Gateway Backdrop */
        .hero-arch-container {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            overflow: hidden;
        }
        .hero-arch-shape {
            position: absolute;
            bottom: 0;
            height: 48%;
            max-height: 300px;
            width: auto;
            opacity: 0.95;
            user-select: none;
        }
        .arch-left {
            left: 50%;
            transform: translateX(-100%) scaleX(-1);
        }
        .arch-right {
            left: 50%;
            transform: translateX(0);
        }

        /* Flanking Campus Buildings */
        .hero-building {
            position: absolute;
            bottom: 0;
            z-index: 4;
            pointer-events: none;
            user-select: none;
            line-height: 0;
        }
        .hero-building img {
            display: block;
            width: clamp(220px, 24vw, 380px);
            height: auto;
            filter: drop-shadow(0 12px 24px rgba(15, 23, 42, 0.1));
        }
        .building-left {
            left: 0;
        }
        .building-right {
            right: 0;
            transform: scaleX(-1);
        }

        /* Content Area (PIONIR Two-Column Balance) */
        .hero-content-wrap {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 1320px;
            margin: 0 auto;
            padding: 30px 32px 0;
            flex-grow: 1;
            display: flex;
            align-items: center;
        }
        .hero-grid {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            align-items: center;
            gap: clamp(24px, 4.5vw, 64px);
            width: 100%;
            margin-bottom: clamp(60px, 12vh, 120px);
        }

        /* Left Column: Mawapres Identity */
        .hero-col-left {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .hero-branding-img {
            display: block;
            width: 100%;
            max-width: clamp(280px, 34vw, 480px);
            height: auto;
            user-select: none;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.06));
        }

        /* Right Column: CTA Box */
        .hero-col-right {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
        }
        .hero-cta-box {
            max-width: 480px;
        }
        .hero-cta-sub {
            display: block;
            font-size: clamp(0.92rem, 1.15vw, 1.12rem);
            font-weight: 500;
            color: #0f172a;
            margin-bottom: 6px;
            letter-spacing: -0.01em;
            line-height: 1.4;
        }
        .hero-cta-title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: clamp(1.35rem, 1.9vw, 1.9rem);
            font-weight: 800;
            color: #0f172a;
            line-height: 1.25;
            margin-bottom: 18px;
            letter-spacing: -0.03em;
        }

        /* Blue Buttons (Replacing orange and yellow per user request) */
        .hero-btn-group {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
        .btn-blue-primary {
            background: #2563eb;
            color: #ffffff !important;
            padding: 0.72rem 1.45rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #1d4ed8;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
            transition: all 0.2s ease;
            cursor: pointer;
            text-decoration: none;
        }
        .btn-blue-primary:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
        }
        .btn-blue-secondary {
            background: #0284c7;
            color: #ffffff !important;
            padding: 0.72rem 1.35rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #0369a1;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
            transition: all 0.2s ease;
            cursor: pointer;
            text-decoration: none;
        }
        .btn-blue-secondary:hover {
            background: #0369a1;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
        }

        /* Bottom Flower Garden Border (Seamless transition) */
        .hero-flower-transition {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            line-height: 0;
            z-index: 6;
            pointer-events: none;
            overflow: hidden;
        }
        .hero-flower-transition img {
            width: 100%;
            height: clamp(38px, 5vw, 65px);
            object-fit: fill;
            display: block;
        }

        /* Verified Metrics Strip Docked Below */
        .hero-metrics-dock {
            position: relative;
            background: #ffffff;
            padding: 0 0 24px;
            z-index: 10;
            line-height: normal;
        }
        .hero-stats-card {
            background: #ffffff;
            border: 1px solid var(--color-border);
            border-radius: 16px;
            padding: 18px 24px;
            box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.07);
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            text-align: center;
            max-width: 1040px;
            margin: -20px auto 0;
            position: relative;
            z-index: 20;
        }

        @media (max-width: 992px) {
            .hero-sky-stage {
                min-height: auto;
                padding-top: 5rem;
            }
            .hero-content-wrap {
                padding-top: 10px;
            }
            .hero-grid {
                grid-template-columns: 1fr;
                gap: 28px;
                text-align: center;
                margin-bottom: 70px;
            }
            .hero-col-left, .hero-col-right {
                align-items: center;
            }
            .hero-branding-img {
                margin: 0 auto;
            }
            .hero-btn-group {
                justify-content: center;
            }
            .hero-stats-card {
                margin-top: 15px;
            }
        }

        @media (max-width: 640px) {
            .hero-stats-card {
                grid-template-columns: repeat(2, 1fr);
                padding: 16px;
                gap: 14px;
            }
            .hero-btn-group {
                flex-direction: column;
                width: 100%;
            }
            .hero-btn-group .btn {
                width: 100%;
                justify-content: center;
            }
            .building-left img, .building-right img {
                width: 160px;
            }
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .stat-item .stat-num {
            font-size: 26px;
            font-weight: 800;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--color-dark);
            line-height: 1.15;
            margin-bottom: 4px;
        }
        .stat-item .stat-lbl {
            font-size: 0.72rem;
            color: var(--color-text-muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* ================== Pengumuman Notice ================== */
        .announce-section {
            padding: 48px 0;
        }
        .announce-notice {
            border-left: 3px solid var(--color-dark);
            padding: 0 0 0 20px;
        }
        .announce-notice .announce-label {
            font-size: 0.74rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted);
            margin-bottom: 8px;
        }
        .announce-notice h3 {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--color-dark);
            margin-bottom: 8px;
            line-height: 1.4;
        }
        .announce-notice p {
            font-size: 0.86rem;
            color: var(--color-text);
            line-height: 1.7;
            margin-bottom: 10px;
            max-width: 720px;
        }
        .announce-notice .announce-date {
            font-size: 0.76rem;
            color: var(--color-text-muted);
        }

        /* ================== Sections ================== */
        .section {
            padding: 84px 0;
            content-visibility: auto;
            contain-intrinsic-size: 1px 800px;
        }
        .section-subtle {
            background: var(--color-bg-subtle);
            border-top: 1px solid var(--color-border);
            border-bottom: 1px solid var(--color-border);
        }
        .section-header {
            text-align: center;
            max-width: 680px;
            margin: 0 auto 52px;
        }
        .section-overline {
            display: block;
            font-size: 0.78rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--color-primary);
            margin-bottom: 10px;
        }
        .section-header h2 {
            font-size: clamp(26px, 3.2vw, 36px);
            font-weight: 800;
            color: var(--color-dark);
            line-height: 1.2;
            margin-bottom: 12px;
        }
        .section-header p {
            font-size: 0.95rem;
            color: var(--color-text-muted);
            line-height: 1.65;
        }

        /* ================== Institutional Workflow Pipeline ================== */
        .workflow-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        @media (max-width: 1024px) {
            .workflow-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .workflow-grid { grid-template-columns: 1fr; }
        }
        .workflow-card {
            background: #ffffff;
            border: 1px solid var(--color-border);
            border-radius: 14px;
            padding: 24px 20px;
            position: relative;
            transition: all 0.2s ease;
        }
        .workflow-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.05);
            transform: translateY(-2px);
        }
        .step-num {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 1.4rem;
            font-weight: 800;
            color: #94a3b8;
            line-height: 1;
            margin-bottom: 14px;
        }
        .workflow-card h3 {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--color-dark);
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .workflow-card p {
            font-size: 0.84rem;
            color: var(--color-text-muted);
            line-height: 1.6;
        }

        /* ================== Assessment Pillars ================== */
        .pillar-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        @media (max-width: 1024px) {
            .pillar-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .pillar-grid { grid-template-columns: 1fr; }
        }
        .pillar-card {
            background: #ffffff;
            border: 1px solid var(--color-border);
            border-radius: 14px;
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.2s ease;
        }
        .pillar-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 6px 18px -4px rgba(15, 23, 42, 0.04);
            transform: translateY(-2px);
        }
        .pillar-icon-box {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: #f1f5f9;
            border: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            color: #475569;
            margin-bottom: 16px;
        }
        .pillar-card h3 {
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--color-dark);
            margin-bottom: 8px;
        }
        .pillar-card p {
            font-size: 0.82rem;
            color: var(--color-text-muted);
            line-height: 1.6;
            margin-bottom: 16px;
            flex: 1;
        }
        .pillar-tag {
            font-size: 0.74rem;
            font-weight: 600;
            color: var(--color-text-muted);
            align-self: flex-start;
        }

        /* ================== Featured Achievements (Editorial Style) ================== */
        .ach-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
        }
        @media (max-width: 992px) { .ach-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; } }
        @media (max-width: 600px) { .ach-grid { grid-template-columns: 1fr; } }
        .ach-card {
            background: #ffffff;
            border: 1px solid var(--color-border);
            border-radius: 14px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.2s ease;
        }
        .ach-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 10px 28px -6px rgba(15, 23, 42, 0.07);
            transform: translateY(-3px);
        }
        .ach-img-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 10;
            overflow: hidden;
            background: #f1f5f9;
        }
        .ach-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.4s ease;
        }
        .ach-card:hover .ach-img {
            transform: scale(1.03);
        }
        .ach-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .ach-card h3 {
            font-size: 1.1rem;
            font-weight: 800;
            margin-bottom: 8px;
            line-height: 1.35;
            color: var(--color-dark);
        }
        .ach-desc {
            font-size: 0.84rem;
            color: var(--color-text-muted);
            line-height: 1.6;
            margin-bottom: 18px;
            flex: 1;
        }
        .ach-link {
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--color-dark);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.15s;
        }
        .ach-card:hover .ach-link {
            color: var(--color-primary);
        }

        /* ================== Institutional CTA Block ================== */
        .cta-box {
            background: #ffffff;
            border: 1px solid var(--color-border);
            border-radius: 18px;
            padding: 56px 36px;
            text-align: center;
            box-shadow: 0 4px 24px -6px rgba(15, 23, 42, 0.05);
            max-width: 920px;
            margin: 0 auto;
            position: relative;
        }
        .cta-box h2 {
            font-size: clamp(24px, 3.2vw, 34px);
            font-weight: 800;
            color: var(--color-dark);
            margin-bottom: 12px;
        }
        .cta-box p {
            font-size: 0.95rem;
            color: var(--color-text-muted);
            max-width: 580px;
            margin: 0 auto 28px;
            line-height: 1.65;
        }
        .cta-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* ================== Footer ================== */
        .footer {
            background: #ffffff;
            border-top: 1px solid var(--color-border);
            padding: 50px 0 28px;
            color: var(--color-text);
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 36px;
        }
        @media (max-width: 992px) {
            .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
            .footer-grid { grid-template-columns: 1fr; }
        }
        .footer-title {
            font-size: 1.05rem;
            font-weight: 800;
            color: var(--color-dark);
            margin-bottom: 10px;
        }
        .footer-desc {
            font-size: 0.84rem;
            color: var(--color-text-muted);
            line-height: 1.7;
            max-width: 380px;
        }
        .footer h4 {
            font-size: 0.76rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-dark);
            margin-bottom: 14px;
        }
        .footer ul { list-style: none; }
        .footer ul li { margin-bottom: 8px; font-size: 0.84rem; color: var(--color-text-muted); }
        .footer ul li a:hover { color: var(--color-primary); }
        .footer-bottom {
            padding-top: 24px;
            border-top: 1px solid var(--color-border);
            text-align: center;
            font-size: 0.78rem;
            color: var(--color-text-muted);
        }
    </style>
</head>

<body>

    <!-- Header / Navbar -->
    <header class="site-header" id="siteHeader">
        <div class="site-header__inner">
            <nav class="site-nav">
                <div class="site-nav__left">
                    <a href="<?= BASE_URL ?>" class="site-nav__brand" aria-label="Beranda">
                        <img src="<?= BASE_URL ?>assets/Logo Mapres (1).png" alt="Logo Mawapres" width="38" height="38" class="brand-logo-img">
                        <div class="brand-text-block">
                            <div class="brand-main-title">MAWAPRES UIN Saizu 2026</div>
                            <div class="brand-sub-title">UIN Prof. K.H. Saifuddin Zuhri</div>
                        </div>
                    </a>

                    <div class="site-nav__menu" id="siteNavMenu">
                        <a href="#beranda" class="active">Beranda</a>
                        <a href="#pengumuman">Pengumuman</a>
                        <a href="#alur">Alur Kurasi</a>
                        <a href="#pilar">Bidang Penilaian</a>
                        <a href="#prestasi">Prestasi Terkini</a>
                    </div>
                </div>

                <div class="site-nav__cta">
                    <a href="<?= BASE_URL ?>auth/login.php" class="btn btn-nav-light">Masuk</a>
                    <a href="#pengumuman" class="btn-nav-bell" aria-label="Notifikasi Pengumuman" title="Notifikasi Pengumuman">
                        <i class="fas fa-bell"></i>
                        <span class="bell-dot-alert"></span>
                    </a>
                    <a href="<?= BASE_URL ?>auth/register.php" class="btn btn-nav-primary">
                        Daftar <i class="fas fa-arrow-right"></i>
                    </a>
                </div>

                <button type="button" class="site-nav__toggle" onclick="toggleMenu()" aria-label="Buka menu" aria-controls="siteNavMobile" aria-expanded="false">
                    <svg class="icon-open" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    <svg class="icon-close" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </nav>

            <div class="site-nav__mobile" id="siteNavMobile">
                <div class="site-nav__mobile-links">
                    <a href="#beranda" class="active">Beranda</a>
                    <a href="#pengumuman">Pengumuman</a>
                    <a href="#alur">Alur Kurasi</a>
                    <a href="#pilar">Bidang Penilaian</a>
                    <a href="#prestasi">Prestasi Terkini</a>
                </div>
                <div class="site-nav__mobile-cta">
                    <a href="<?= BASE_URL ?>auth/login.php" class="btn btn-nav-light">Masuk</a>
                    <a href="<?= BASE_URL ?>auth/register.php" class="btn btn-nav-primary">Daftar</a>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section - Mawapres UIN Saizu Institutional Landing -->
    <section class="hero" id="beranda">
        <div class="hero-sky-stage">
            <!-- Animated Pixel Clouds -->
            <div class="pixel-cloud cloud-left">
                <img src="<?= BASE_URL ?>assets/awan.png" alt="Awan" width="554" height="136">
            </div>
            <div class="pixel-cloud cloud-mid">
                <img src="<?= BASE_URL ?>assets/awan.png" alt="Awan" width="554" height="136">
            </div>
            <div class="pixel-cloud cloud-right">
                <img src="<?= BASE_URL ?>assets/awan.png" alt="Awan" width="554" height="136">
            </div>

            <!-- Geometric Center Arch Backdrop -->
            <div class="hero-arch-container">
                <img src="<?= BASE_URL ?>assets/awan-gede.png" alt="" class="hero-arch-shape arch-left">
                <img src="<?= BASE_URL ?>assets/awan-gede.png" alt="" class="hero-arch-shape arch-right">
            </div>

            <!-- Flanking UIN Saizu Buildings -->
            <div class="hero-building building-left">
                <img src="<?= BASE_URL ?>assets/gedung-uin.png" alt="Gedung UIN Saizu Sayap Kiri" width="755" height="616">
            </div>
            <div class="hero-building building-right">
                <img src="<?= BASE_URL ?>assets/gedung-uin.png" alt="Gedung UIN Saizu Sayap Kanan" width="755" height="616">
            </div>

            <!-- Content Area: 2-Column Responsive Grid -->
            <div class="container hero-content-wrap">
                <div class="hero-grid">
                    <!-- Left: Brand Identity Typography -->
                    <div class="hero-col-left">
                        <img src="<?= BASE_URL ?>assets/teks-mawapres.png" alt="Mawapres UIN Prof. K.H. Saifuddin Zuhri Purwokerto - BeTheYoungExcellent" class="hero-branding-img" width="1126" height="379" loading="eager" fetchpriority="high">
                    </div>

                    <!-- Right: Call to Action with Blue Buttons -->
                    <div class="hero-col-right">
                        <div class="hero-cta-box">
                            <span class="hero-cta-sub">Persiapkan dirimu untuk</span>
                            <h1 class="hero-cta-title">Mahasiswa Award UIN SAIZU 2026</h1>
                            <div class="hero-btn-group">
                                <a href="<?= BASE_URL ?>auth/register.php" class="btn btn-blue-primary">
                                    Dapatkan Semua Informasi <i class="fas fa-arrow-right"></i>
                                </a>
                                <a href="#pengumuman" class="btn btn-blue-secondary">
                                    Kenali lebih jauh
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floral Bottom Border: Seamless bridge connecting to the section below -->
            <div class="hero-flower-transition">
                <img src="<?= BASE_URL ?>assets/bunga_border.png" alt="Dekorasi Taman Bunga" width="2880" height="220">
            </div>
        </div>

        <!-- Verified Metrics Strip (Docked directly beneath the flower garden border) -->
        <div class="hero-metrics-dock">
            <div class="container">
                <div class="hero-stats-card">
                    <div class="stat-item">
                        <span class="stat-num" data-count="<?= (int)$totalRecords ?>" data-suffix="+">0</span>
                        <span class="stat-lbl">Prestasi Sah</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num" data-count="<?= (int)($totalNasional + $totalInter) ?>">0</span>
                        <span class="stat-lbl">Tingkat Nasional/Global</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num" data-count="6">0</span>
                        <span class="stat-lbl">Fakultas Aktif</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-num" data-count="<?= (int)$totalStudents ?>">0</span>
                        <span class="stat-lbl">Talenta Terdaftar</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pengumuman Section -->
    <section class="announce-section" id="pengumuman">
        <div class="container">
            <div class="announce-notice">
                <div class="announce-label">Pengumuman</div>
                <h3>Seleksi Mahasiswa Award & Mawapres 2026 Akan Segera Dibuka</h3>
                <p>Kepada seluruh mahasiswa aktif UIN Prof. K.H. Saifuddin Zuhri Purwokerto, pendaftaran seleksi Pemilihan Mahasiswa Berprestasi (Mawapres) dan Penganugerahan Mahasiswa Award Tahun 2026 akan segera dibuka. Pastikan portofolio prestasi telah tercatat lengkap di sistem sebelum batas akhir pendaftaran.</p>
                <div class="announce-date"><?= date('d M Y') ?> — Bagian Kemahasiswaan</div>
            </div>
        </div>
    </section>

    <!-- Alur Kerja / Kurasi Section (Replaces generic 6 cards) -->
    <section class="section section-subtle" id="alur">
        <div class="container">
            <div class="section-header">
                <span class="section-overline">Alur Kurasi</span>
                <h2>Proses Kurasi Portofolio yang Transparan.</h2>
                <p>Empat tahapan terstandarisasi untuk menjamin setiap capaian mahasiswa tercatat sah, terverifikasi keasliannya, dan diakui universitas.</p>
            </div>

            <div class="workflow-grid">
                <div class="workflow-card">
                    <div class="step-num">01</div>
                    <h3>Pencatatan Mandiri</h3>
                    <p>Mahasiswa mendaftarkan riwayat kejuaraan dan mengunggah pindaian sertifikat, piagam, atau SK resmi secara digital.</p>
                </div>
                <div class="workflow-card">
                    <div class="step-num">02</div>
                    <h3>Kurasi Tim Penilai</h3>
                    <p>Verifikator kampus meninjau keabsahan berkas, kredibilitas penyelenggara, dan kevalidan bukti keikutsertaan.</p>
                </div>
                <div class="workflow-card">
                    <div class="step-num">03</div>
                    <h3>Kalkulasi Skor Sah</h3>
                    <p>Sistem secara otomatis mengalkulasi bobot poin berdasarkan level capaian (Kampus, Regional, Nasional, hingga Internasional).</p>
                </div>
                <div class="workflow-card">
                    <div class="step-num">04</div>
                    <h3>Sertifikasi & Rekap</h3>
                    <p>Data terverifikasi diterbitkan dalam rekapitulasi PDF resmi ber-KOP UIN Saizu untuk syarat beasiswa dan seleksi Pilmapres.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pilar Bidang Prestasi -->
    <section class="section" id="pilar">
        <div class="container">
            <div class="section-header">
                <span class="section-overline">Kategori Penilaian</span>
                <h2>Bidang Capaian yang Diakui &amp; Dinilai.</h2>
                <p>Mawapres UIN Saizu mengakui keunggulan akademik maupun non-akademik sesuai pedoman pusat prestasi nasional.</p>
            </div>

            <div class="pillar-grid">
                <div class="pillar-card">
                    <div>
                        <div class="pillar-icon-box"><i class="fas fa-flask-vial"></i></div>
                        <h3>Sains &amp; Karya Ilmiah</h3>
                        <p>Karya Tulis Ilmiah (KTI), Program Kreativitas Mahasiswa (PKM), olimpiade sains, esai riset, dan publikasi jurnal terakreditasi.</p>
                    </div>
                    <span class="pillar-tag">Akademik &bull; Riset</span>
                </div>

                <div class="pillar-card">
                    <div>
                        <div class="pillar-icon-box"><i class="fas fa-book-quran"></i></div>
                        <h3>Keagamaan &amp; Bahasa</h3>
                        <p>Musabaqah Tilawatil Qur'an (MTQ), Musabaqah Qiraatil Kutub (MQK), kaligrafi, debat bahasa Arab dan bahasa Inggris.</p>
                    </div>
                    <span class="pillar-tag">Keagamaan &bull; Bahasa</span>
                </div>

                <div class="pillar-card">
                    <div>
                        <div class="pillar-icon-box"><i class="fas fa-medal"></i></div>
                        <h3>Seni &amp; Olahraga</h3>
                        <p>Pekan Olahraga Mahasiswa Nasional (POMNAS), kejuaraan beladiri, seni musik, fotografi, dan seni pertunjukan resmi.</p>
                    </div>
                    <span class="pillar-tag">Olahraga &bull; Seni</span>
                </div>

                <div class="pillar-card">
                    <div>
                        <div class="pillar-icon-box"><i class="fas fa-lightbulb"></i></div>
                        <h3>Inovasi &amp; Bisnis</h3>
                        <p>Kompetisi rencana bisnis (Business Plan), kewirausahaan mahasiswa, startup teknologi, dan pengabdian masyarakat inspiratif.</p>
                    </div>
                    <span class="pillar-tag">Inovasi &bull; Talenta</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Achievements Showcase (Editorial Format) -->
    <?php if (!empty($featured)): ?>
    <section class="section section-subtle" id="prestasi">
        <div class="container">
            <div class="section-header">
                <span class="section-overline">Sorotan Prestasi</span>
                <h2>Capaian Terkini Mahasiswa UIN Saizu.</h2>
                <p>Dokumentasi prestasi membanggakan yang telah terverifikasi resmi oleh panitia dan universitas.</p>
            </div>

            <div class="ach-grid">
                <?php foreach ($featured as $item): ?>
                    <a href="<?= BASE_URL ?>detail_prestasi.php?id=<?= $item['id'] ?>" class="ach-card">
                        <div class="ach-img-wrap">
                            <img class="ach-img" src="<?= BASE_URL . htmlspecialchars($item['image_path']) ?>" alt="<?= htmlspecialchars($item['title']) ?>" width="640" height="400" loading="lazy" decoding="async">
                        </div>
                        <div class="ach-body">
                            <h3><?= htmlspecialchars($item['title']) ?></h3>
                            <p class="ach-desc"><?= htmlspecialchars(mb_substr($item['description'], 0, 130)) ?><?= mb_strlen($item['description']) > 130 ? '…' : '' ?></p>
                            <span class="ach-link">
                                <span>Baca Ulasan Lengkap</span>
                                <i class="fas fa-arrow-right" style="font-size: 11px;"></i>
                            </span>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>

            <div style="text-align: center; margin-top: 42px;">
                <a href="<?= BASE_URL ?>all-achievements.php" class="btn btn-outline-dark">
                    Lihat Seluruh Prestasi Mahasiswa <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Dignified Institutional Call to Action -->
    <section class="section">
        <div class="container">
            <div class="cta-box">
                <h2>Abadikan Jejak Prestasimu di Sistem Resmi Kampus.</h2>
                <p>Jadilah bagian dari generasi unggul UIN Prof. K.H. Saifuddin Zuhri Purwokerto yang berkontribusi nyata di kancah daerah, nasional, dan internasional.</p>
                <div class="cta-actions">
                    <a href="<?= BASE_URL ?>auth/register.php" class="btn btn-primary-pill">
                        <i class="fas fa-user-plus"></i> Buat Akun Mahasiswa
                    </a>
                    <a href="<?= BASE_URL ?>auth/login.php" class="btn btn-outline-dark">
                        <i class="fas fa-arrow-right-to-bracket"></i> Masuk ke Akun
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-title">Portal Mahasiswa Berprestasi (Mawapres)</div>
                    <p class="footer-desc">
                        Pusat pencatatan, kurasi, dan pemeringkatan resmi prestasi mahasiswa
                        UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
                    </p>
                </div>
                <div>
                    <h4>Navigasi</h4>
                    <ul>
                        <li><a href="#beranda">Beranda</a></li>
                        <li><a href="#alur">Alur Kurasi</a></li>
                        <li><a href="#pilar">Bidang Penilaian</a></li>
                        <li><a href="#prestasi">Sorotan Prestasi</a></li>
                        <li><a href="<?= BASE_URL ?>all-achievements.php">Semua Prestasi</a></li>
                    </ul>
                </div>
                <div>
                    <h4>Akses Akun</h4>
                    <ul>
                        <li><a href="<?= BASE_URL ?>auth/login.php">Masuk Akun</a></li>
                        <li><a href="<?= BASE_URL ?>auth/register.php">Registrasi Mahasiswa</a></li>
                        <li><a href="<?= BASE_URL ?>search.php">Cari Arsip Prestasi</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; <?= date('Y') ?> UIN Prof. K.H. Saifuddin Zuhri Purwokerto. Hak Cipta Dilindungi Undang-Undang.
            </div>
        </div>
    </footer>

    <!-- GSAP Counter Logic -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script>
        // Mobile menu toggle
        function toggleMenu() {
            const menu = document.getElementById('siteNavMobile');
            const toggle = document.querySelector('.site-nav__toggle');
            if (!menu || !toggle) return;
            const isOpen = menu.classList.contains('open');
            menu.classList.toggle('open', !isOpen);
            toggle.setAttribute('aria-expanded', String(!isOpen));
        }

        // Live counter animation
        document.addEventListener('DOMContentLoaded', () => {
            const counters = document.querySelectorAll('[data-count]');
            counters.forEach(el => {
                const target = +el.dataset.count || 0;
                const suffix = el.dataset.suffix || '';
                let current = 0;
                const duration = 1200;
                const step = target / (duration / 16);
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target.toLocaleString('id-ID') + suffix;
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.round(current).toLocaleString('id-ID') + suffix;
                    }
                }, 16);
            });
        });
    </script>
</body>
</html>
