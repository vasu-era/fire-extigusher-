<?php
include 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    $id = $_POST['id'];
    $customer_name = $_POST['customer_name'];
    $mobile = $_POST['mobile'];
    $address = $_POST['address'];
    $service_date = $_POST['service_date'];
    $total_qty = $_POST['total_qty']; // Live js variable yahan dynamic collect hoga

    // 🎯 FIX: Form se dropdown validity duration (12, 24, 36) receive karein
    $duration_months = isset($_POST['expiry_duration']) ? intval($_POST['expiry_duration']) : 12;

    if (!empty($service_date)) {
        // 🟢 BACKEND PHP CALCULATION:
        // Issue Date (YYYY-MM-DD) se naya date object banayein
        $date = new DateTime($service_date);
        
        // Dropdown ke months (12, 24, ya 36) ko add karein
        $date->modify("+" . $duration_months . " months");
        
        // 1 din kam karne ka safety rule
        $date->modify("-1 day");
        
        // MySQL ke liye perfect format (YYYY-MM-DD)
        $expiry_date = $date->format('Y-m-d');
    } else {
        // Agar kisi wajah se issue date blank ho
        $service_date = date('Y-m-d');
        $expiry_date = date('Y-m-d', strtotime("+1 year -1 day"));
    }

    // 1. Main Customers data update karein
    mysqli_query($conn, "UPDATE customers SET 
        customer_name='$customer_name',
        mobile='$mobile',
        address='$address',
        service_date='$service_date',
        expiry_date='$expiry_date',
        total_qty='$total_qty'
        WHERE id='$id'"
    );

    // 2. Extinguisher details purani flush out (delete) karein data redundancy se bachne ke liye
    mysqli_query($conn, "DELETE FROM extinguisher_details WHERE customer_id='$id'");

    // 3. Dynamic input list parameters arrays ko fetch karke re-insert karein
    $ext_types = $_POST['ext_type'];
    $ext_capacities = $_POST['ext_capacity'];
    $ext_qtys = $_POST['ext_qty'];

    for ($i = 0; $i < count($ext_types); $i++) {
        $type = $ext_types[$i];
        $capacity = $ext_capacities[$i];
        $qty = $ext_qtys[$i];

        if (!empty($type) && !empty($capacity) && !empty($qty)) {
            mysqli_query($conn, "INSERT INTO extinguisher_details (customer_id, ext_type, ext_capacity, ext_qty) VALUES ('$id', '$type', '$capacity', '$qty')");
        }
    }

    // Process hone ke baad successfully list par return karein
    header("Location: customers.php");
    exit();
}
?>