<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
include 'db.php'; // Aapki database file ka naam agar alag hai to wo likhein

// 📅 AUTOMATIC PRESENT FINANCIAL YEAR CALCULATOR
$current_month = date('m');
$current_year = date('Y');

if ($current_month >= 4) {
    $present_fy_start = $current_year;
    $present_fy_end = $current_year + 1;
} else {
    $present_fy_start = $current_year - 1;
    $present_fy_end = $current_year;
}
$present_fy_key = substr($present_fy_start, 2) . '-' . substr($present_fy_end, 2);

// 🔄 GLOBAL SESSION SETTING: Agar URL me saal badla, to browser memory me save karo
if (isset($_GET['fy'])) {
    $_SESSION['global_fy'] = $_GET['fy'];
    
    // Auto Redirect taaki URL me se ?fy= clear ho jaye aur effect permanent rahe
    $clean_url = strtok($_SERVER["REQUEST_URI"], '?');
    header("Location: " . $clean_url);
    exit();
}

// Agar session me kuch nahi hai, to default current year set karo
if (!isset($_SESSION['global_fy'])) {
    $_SESSION['global_fy'] = $present_fy_key;
}

$global_selected_fy = $_SESSION['global_fy'];

// 🔍 AUTOMATIC HISTORICAL YEARS LIST (Dropdown ke liye)
$years_list = array();
$min_year_query = mysqli_query($conn, "SELECT MIN(service_date) as oldest_date FROM customers WHERE service_date IS NOT NULL AND service_date != '0000-00-00'");
$min_year_row = mysqli_fetch_assoc($min_year_query);
$oldest_year = ($min_year_row['oldest_date']) ? date('Y', strtotime($min_year_row['oldest_date'])) : 2025;

for ($y = $present_fy_start; $y >= $oldest_year - 1; $y--) {
    $f_key = substr($y, 2) . '-' . substr($y + 1, 2);
    $f_label = "FY " . $y . "-" . substr($y + 1, 2);
    $years_list[$f_key] = $f_label;
}

// 📑 GLOBAL SQL WHERE CLAUSE GENERATOR
$global_where = "";
$global_fy_display = "All Time Records";

if ($global_selected_fy !== 'all' && $global_selected_fy !== 'others') {
    $years = explode('-', $global_selected_fy);
    $start_date = "20" . $years[0] . "-04-01";
    $end_date   = "20" . $years[1] . "-03-31";
    $global_where = "WHERE service_date BETWEEN '$start_date' AND '$end_date'";
    $global_fy_display = "FY 20" . $years[0] . "-" . $years[1];
} elseif ($global_selected_fy == 'others') {
    $global_where = "WHERE service_date IS NULL OR service_date = '0000-00-00'";
    $global_fy_display = "Unassigned Records";
}
?>