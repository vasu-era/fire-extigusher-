<?php
include 'db.php';

// 📅 1. Request se Service Date uthao (Default Today)
$service_date = isset($_GET['service_date']) && !empty($_GET['service_date']) ? $_GET['service_date'] : date('Y-m-d');

$time    = strtotime($service_date);
$s_month = (int)date('m', $time);
$s_year  = (int)date('Y', $time);

// 📅 2. Selected Date se Financial Year Calculate Karein
if ($s_month >= 4) {
    // April se December (e.g. 2026 -> FY 26-27)
    $fy_start = $s_year . '-04-01';
    $fy_end   = ($s_year + 1) . '-03-31';
    $fy_short = date('y', $time) . '-' . date('y', strtotime('+1 year', $time));
} else {
    // January se March (e.g. 2027 -> FY 26-27)
    $fy_start = ($s_year - 1) . '-04-01';
    $fy_end   = $s_year . '-03-31';
    $fy_short = date('y', strtotime('-1 year', $time)) . '-' . date('y', $time);
}

// 🔢 3. Us FY ke certificate_no me se sabse highest number nikalein
// Example pattern matching: 'RGS/26-27/%'
$prefix = "RGS/" . $fy_short . "/";

$query = "SELECT certificate_no FROM customers 
          WHERE service_date BETWEEN '$fy_start' AND '$fy_end' 
          AND certificate_no LIKE '$prefix%' 
          ORDER BY id DESC LIMIT 1";

$result = mysqli_query($conn, $query);

$next_number = 1; // Default agar us FY me koi record na ho

if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    $last_cert = $row['certificate_no']; // e.g. RGS/26-27/329
    
    // Slash (/) ke baad wala last number alag karein
    $parts = explode('/', $last_cert);
    $last_num = end($parts);
    
    if (is_numeric($last_num)) {
        $next_number = (int)$last_num + 1;
    }
}

// 📄 4. Final Output (e.g. RGS/25-26/330 ya RGS/26-27/1)
echo $prefix . $next_number;
?>