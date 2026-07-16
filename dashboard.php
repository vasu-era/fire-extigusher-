<?php
session_start();

if(!isset($_SESSION['login']))
{
    header("Location: login.php");
    exit;
}

include 'db.php';

// 📅 1. GLOBAL FINANCIAL YEAR SELECT LOGIC (Session Memory System)
if (isset($_GET['fy'])) {
    $_SESSION['global_fy'] = $_GET['fy'];
    header("Location: dashboard.php");
    exit;
}

if (!isset($_SESSION['global_fy'])) {
    $_SESSION['global_fy'] = '26-27';
}

$selected_fy = $_SESSION['global_fy'];

if ($selected_fy == '25-26') {
    $start_date = '2025-04-01';
    $end_date   = '2026-03-31';
    $fy_title   = '2025-26';
} else {
    // Default 2026-27
    $start_date = '2026-04-01';
    $end_date   = '2027-03-31';
    $fy_title   = '2026-27';
}

// 📊 2. ALL COUNTER QUERIES FILTERED BY FINANCIAL YEAR
$totalCustomers = mysqli_fetch_assoc(
mysqli_query($conn,"SELECT COUNT(*) AS total FROM customers WHERE service_date BETWEEN '$start_date' AND '$end_date'")
)['total'];

$expiryDue = mysqli_fetch_assoc(
mysqli_query($conn,"
SELECT COUNT(*) AS total
FROM customers
WHERE (expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
AND service_date BETWEEN '$start_date' AND '$end_date'
")
)['total'];

$expiredCustomers = mysqli_fetch_assoc(
mysqli_query($conn,"
SELECT COUNT(*) AS total
FROM customers
WHERE expiry_date < CURDATE()
AND service_date BETWEEN '$start_date' AND '$end_date'
")
)['total'];

$monthlyExpired = mysqli_fetch_assoc(
mysqli_query($conn,"
SELECT COUNT(*) AS total
FROM customers
WHERE MONTH(expiry_date)=MONTH(CURDATE())
AND YEAR(expiry_date)=YEAR(CURDATE())
AND service_date BETWEEN '$start_date' AND '$end_date'
")
)['total'];

// 🔔 3. NOTIFICATION LOGIC (FY + Current Month + Un-renewed Expiry)
$current_date  = date('Y-m-d');
$current_month = date('m');
$current_year  = date('Y');

$notification_query = "
    SELECT c1.id, c1.customer_name, c1.certificate_no, c1.expiry_date 
    FROM customers c1 
    WHERE 
        -- Expiry selected FY ke under hone chahiye
        c1.expiry_date BETWEEN '$start_date' AND '$end_date'
        -- Expiry sirf Current Month/Year ki honi chahiye
        AND MONTH(c1.expiry_date) = '$current_month'
        AND YEAR(c1.expiry_date) = '$current_year'
        -- Mobile Validation
        AND c1.mobile IS NOT NULL AND c1.mobile != ''
        -- Check: Mobile par koi naye ID ki entry na mili ho (Un-renewed)
        AND NOT EXISTS (
            SELECT 1 FROM customers c2 
            WHERE c2.mobile = c1.mobile 
            AND c2.id > c1.id
        )
    ORDER BY c1.expiry_date ASC 
    LIMIT 20";

$notification_result = mysqli_query($conn, $notification_query);
$total_notifications = mysqli_num_rows($notification_result);
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard - Rakesh Gas Suppliers</title>
<style>
:root {
    --bg-main: #f8fafc;
    --sidebar-bg: #1e293b;
    --sidebar-hover: #334155;
    --text-light: #94a3b8;
    --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

body{
    background: var(--bg-main);
    display: flex;
    min-height: 100vh;
}

/* 📊 SIDEBAR STYLING */
.sidebar {
    width: 260px;
    background: var(--sidebar-bg);
    color: white;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
    z-index: 100;
}

.sidebar-header {
    padding: 24px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    color: #f8fafc;
}

.sidebar-menu {
    list-style: none;
    padding: 15px 10px;
    flex: 1;
}

.sidebar-menu li { margin-bottom: 5px; }

.sidebar-menu a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 15px;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.sidebar-menu a:hover, .sidebar-menu a.active {
    background: var(--sidebar-hover);
    color: white;
}

/* 🚀 MAIN CONTENT WRAPPER */
.main-content {
    margin-left: 260px;
    flex: 1;
    padding: 30px;
}

/* 🔝 TOP NAVBAR HEADER */
.top-navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    background: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: var(--card-shadow);
}

.top-navbar h1 {
    font-size: 22px;
    color: #0f172a;
    font-weight: 700;
}

.header-right-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* 📅 FY DROPDOWN STYLING */
.fy-selector {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    cursor: pointer;
    outline: none;
}

.logout-btn {
    background: #ef4444;
    color: white;
    padding: 8px 18px;
    text-decoration: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.2s;
}

.logout-btn:hover { background: #dc2626; }

/* 🗂️ COLOR CODED ANALYTICS CARDS */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: var(--card-shadow);
    border-top: 4px solid #cbd5e1;
}

.stat-card.total { border-top-color: #3b82f6; }
.stat-card.due { border-top-color: #f59e0b; }
.stat-card.expired { border-top-color: #ef4444; }
.stat-card.report { border-top-color: #10b981; }

.stat-card h2 { font-size: 32px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
.stat-card p { font-size: 14px; color: #64748b; font-weight: 500; }

/* 🏢 BOTTOM CONTENT SPLIT LAYOUT */
.dashboard-details-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 25px;
    align-items: start;
}

.welcome-panel {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: var(--card-shadow);
    min-height: 380px;
}

.panel-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 12px;
}

.panel-header-flex h3 { font-size: 16px; color: #0f172a; font-weight: 700; }
.view-all-link { font-size: 13px; color: #3b82f6; text-decoration: none; font-weight: 600; }

.recent-table { width: 100%; border-collapse: collapse; text-align: left; }
.recent-table th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 12px 10px; }
.recent-table td { padding: 14px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; }

.cust-name-badge { display: flex; align-items: center; gap: 8px; }
.user-avatar-icon { font-size: 14px; background: #f1f5f9; padding: 4px; border-radius: 50%; }
.cert-badge { background: #eff6ff; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }
.table-view-btn { background: #3b82f6; color: white; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; }

/* 🔔 NOTIFICATION PORTAL */
.rgs-portal-card { background: #ffffff; border-radius: 12px; box-shadow: var(--card-shadow); overflow: hidden; width: 100%; }
.rgs-portal-header { background: #0f172a; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
.rgs-portal-header h3 { color: #ffffff; font-size: 13px; font-weight: 600; }
.portal-counter { background: #ef4444; color: white; font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.rgs-portal-body { max-height: 300px; overflow-y: auto; }
.portal-no-data { text-align: center; color: #64748b; padding: 30px 15px; font-size: 13px; font-weight: 500; }
.rgs-portal-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
.item-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
.expired-item .status-dot { background: #ef4444; }
.today-item .status-dot { background: #f59e0b; }
.pending-item .status-dot { background: #3b82f6; }
.notif-text { margin: 0; color: #334155; font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.action-btn-icon { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #e2e8f0; text-decoration: none; }
.rgs-portal-footer { padding: 12px 18px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; justify-content: flex-end; }
.show-more-link { color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 600; }
</style>
</head>
<body>

<!-- 📊 LEFT PANEL SIDEBAR NAVIGATION -->
<div class="sidebar">
    <div class="sidebar-header">🔥 RGS Admin</div>
    <ul class="sidebar-menu">
        <li><a href="#" class="active">📊 Dashboard</a></li>
        <li><a href="fire.html">➕ New Customer</a></li>
        <li><a href="customers.php">👥 Customer List</a></li>
        <li><a href="expiry.php">⏰ Expiry Due</a></li>
        <li><a href="monthly_report.php">📅 Monthly Report</a></li>
        <li><a href="export.php">📈 Export Excel</a></li>
    </ul>
</div>

<!-- 🚀 MAIN CONTENT WRAPPER -->
<div class="main-content">
    
    <!-- Top Header Bar with FY Selector -->
    <div class="top-navbar">
        <h1>RAKESH GAS SUPPLIERS</h1>
        <div class="header-right-actions">
            <select class="fy-selector" onchange="location = 'dashboard.php?fy=' + this.value;">
                <option value="26-27" <?php if($selected_fy == '26-27') echo 'selected'; ?>>FY 2026-27</option>
                <option value="25-26" <?php if($selected_fy == '25-26') echo 'selected'; ?>>FY 2025-26</option>
            </select>
            
            <a href="logout.php" class="logout-btn">🚪 Logout</a>
        </div>
    </div>

    <!-- Filtered Analytics Cards -->
    <div class="cards-grid">
        <div class="stat-card total">
            <h2><?php echo (int)$totalCustomers; ?></h2>
            <p>Total Customers (FY)</p>
        </div>
        <div class="stat-card due">
            <h2><?php echo (int)$expiryDue; ?></h2>
            <p>Expiry Due (30 Days)</p>
        </div>
        <div class="stat-card expired">
            <h2><?php echo (int)$expiredCustomers; ?></h2>
            <p>Expired Customers</p>
        </div>
        <div class="stat-card report">
            <h2><?php echo (int)$monthlyExpired; ?></h2>
            <p>Monthly Report Count</p>
        </div>
    </div>

    <div class="dashboard-details-layout">
        
        <!-- 👥 LEFT PANEL: RECENT CUSTOMERS TABLE -->
        <div class="welcome-panel">
            <div class="panel-header-flex">
                <h3>➕ Recently Added (FY <?php echo htmlspecialchars($selected_fy); ?>)</h3>
                <a href="customers.php" class="view-all-link">View All Customers →</a>
            </div>
            
            <table class="recent-table">
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Certificate No.</th>
                        <th>Expiry Date</th>
                        <th style="text-align: center;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $recent_query = "SELECT id, customer_name, certificate_no, expiry_date FROM customers WHERE service_date BETWEEN '$start_date' AND '$end_date' ORDER BY id DESC LIMIT 5";
                    $recent_result = mysqli_query($conn, $recent_query);

                    if(mysqli_num_rows($recent_result) > 0) {
                        while($row_customer = mysqli_fetch_assoc($recent_result)) {
                            $exp_date = date("d/m/Y", strtotime($row_customer['expiry_date']));
                            ?>
                            <tr>
                                <td>
                                    <div class="cust-name-badge">
                                        <span class="user-avatar-icon">👤</span>
                                        <b><?php echo htmlspecialchars($row_customer['customer_name']); ?></b>
                                    </div>
                                </td>
                                <td><span class="cert-badge">📄 <?php echo htmlspecialchars($row_customer['certificate_no']); ?></span></td>
                                <td><span>📅 <?php echo $exp_date; ?></span></td>
                                <td style="text-align: center;">
                                    <a href="certificate_new.php?id=<?php echo (int)$row_customer['id']; ?>" target="_blank" class="table-view-btn">👁️ View</a>
                                </td>
                            </tr>
                            <?php
                        }
                    } else {
                        echo '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding: 40px 0;">Is financial year me koi customer nahi hai.</td></tr>';
                    }
                    ?>
                </tbody>
            </table>
        </div>

        <!-- 🔔 RIGHT PANEL: NOTIFICATION PORTAL -->
        <div class="rgs-portal-card">
            <div class="rgs-portal-header">
                <!-- Dynamic Header Label -->
                <h3>Notifications (FY <?php echo htmlspecialchars($fy_title); ?> - <?php echo date('M Y'); ?>)</h3>
                <?php if($total_notifications > 0): ?>
                    <span class="portal-counter"><?php echo $total_notifications; ?></span>
                <?php endif; ?>
            </div>
            
            <div class="rgs-portal-body">
                <?php 
                if($total_notifications > 0) {
                    while($notif = mysqli_fetch_assoc($notification_result)) {
                        $expiry_time = strtotime($notif['expiry_date']);
                        $current_time = strtotime($current_date);
                        $days_left = round(($expiry_time - $current_time) / (60 * 60 * 24));
                        
                        if($days_left < 0) {
                            $msg_text = "Expired: " . htmlspecialchars($notif['customer_name']);
                            $item_class = "expired-item";
                        } elseif($days_left == 0) {
                            $msg_text = "Expiring Today: " . htmlspecialchars($notif['customer_name']);
                            $item_class = "today-item";
                        } else {
                            $msg_text = htmlspecialchars($notif['customer_name']) . " (" . $days_left . " Days left)";
                            $item_class = "pending-item";
                        }
                        ?>
                        <div class="rgs-portal-item <?php echo $item_class; ?>">
                            <div class="item-left">
                                <span class="status-dot"></span>
                                <p class="notif-text" title="<?php echo $msg_text; ?>"><?php echo $msg_text; ?></p>
                            </div>
                            <a href="renew_customer.php?id=<?php echo (int)$notif['id']; ?>" class="action-btn-icon" title="Renew Customer">⚙️</a>
                        </div>
                        <?php
                    }
                } else {
                    echo '<div class="portal-no-data">✅ Is FY '.htmlspecialchars($fy_title).' me is mahine ka koi pending un-renewed notification nahi hai.</div>';
                }
                ?>
            </div>
            <div class="rgs-portal-footer">
                <a href="monthly_report.php" class="show-more-link">Show All</a>
            </div>
        </div>

    </div>
</div>

</body>
</html>