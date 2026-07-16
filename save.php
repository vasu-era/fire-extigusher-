<?php

include 'db.php';

$customer_name = $_POST['customer_name'];
$mobile = $_POST['mobile'];
$service_date = $_POST['service_date'];
$expiry_date_form = $_POST['expiry_date']; 

// DD/MM/YYYY ko tod kar YYYY-MM-DD banana
$date_parts = explode('/', $expiry_date_form);
$expiry_date = $date_parts[2] . '/' . $date_parts[0] . '/' . $date_parts[1];
$total_qty = $_POST['total_qty'];
$address = $_POST['address'];

// 🔢 AUTOMATIC CERTIFICATE NUMBER LOGIC (Universal Sequencing)
// Pehle database se sabsbse aakhiri/bada certificate no. nikalte hain
$max_cert_query = mysqli_query($conn, "SELECT certificate_no FROM customers ORDER BY id DESC LIMIT 1");
$max_cert_row = mysqli_fetch_assoc($max_cert_query);

$prefix = "RGS/2026-27/";
$next_number = 1;

if ($max_cert_row) {
    $latest_cert = $max_cert_row['certificate_no']; // e.g., "RGS/2026-27/29"
    $parts = explode('/', $latest_cert);
    $last_part = end($parts); // Yeh "29" nikalega
    if (is_numeric($last_part)) {
        $next_number = (int)$last_part + 1; // 29 + 1 = 30
    }
}
$auto_generated_no = $prefix . $next_number;

// 🎯 YAHAN SYNC CHECK: Agar form se pehle se sahi number aaya hai toh wo rakho, nahi toh auto wala use karo
if (isset($_POST['certificate_no']) && !empty($_POST['certificate_no']) && strpos($_POST['certificate_no'], 'RGS/') !== false) {
    $certificate_no = $_POST['certificate_no'];
} else {
    $certificate_no = $auto_generated_no;
}


// Customer Save
$sql = "INSERT INTO customers
(
certificate_no,
customer_name,
mobile,
service_date,
expiry_date,
total_qty,
address
)

VALUES
(
'$certificate_no',
'$customer_name',
'$mobile',
'$service_date',
'$expiry_date',
'$total_qty',
'$address'
)";

mysqli_query($conn, $sql);

// Customer ID
$customer_id = mysqli_insert_id($conn);

// Extinguisher Details Save (With Individual Pricing)

if(isset($_POST['ext_type']))
{
    $types = $_POST['ext_type'];
    $capacities = $_POST['ext_capacity'];
    $qtys = $_POST['ext_qty'];
    
    // 💰 Naye pricing arrays ko capture karna
    $refilling_prices = $_POST['ext_refilling_price'];
    $new_prices = $_POST['ext_new_price'];

    for($i=0; $i<count($types); $i++)
    {
        $type = mysqli_real_escape_string($conn, $types[$i]);
        $capacity = mysqli_real_escape_string($conn, $capacities[$i]);
        $qty = (int)$qtys[$i];
        
        // Har row ki specific price nikalna
        $ref_price = !empty($refilling_prices[$i]) ? floatval($refilling_prices[$i]) : 0.00;
        $n_price = !empty($new_prices[$i]) ? floatval($new_prices[$i]) : 0.00;

        // 🎯 INSERT Query me pricing fields ko jodh diya gaya hai
        $sql = "INSERT INTO extinguisher_details
        (customer_id, ext_type, ext_capacity, ext_qty, ext_refilling_price, ext_new_price)
        VALUES
        ('$customer_id', '$type', '$capacity', '$qty', '$ref_price', '$n_price')";

        if(!mysqli_query($conn, $sql))
        {
            die("Insert Error: " . mysqli_error($conn));
        }
    }
}

// New Certificate
header("Location: certificate_new.php?id=".$customer_id);
exit;

?>