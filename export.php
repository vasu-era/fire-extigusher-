<?php

include 'db.php';

header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=customers.xls");

echo "Certificate No\t";
echo "Customer Name\t";
echo "Mobile\t";
echo "Service Date\t";
echo "Expiry Date\t";
echo "Total Qty\t";
echo "Address\n";

$result = mysqli_query($conn,"SELECT * FROM customers");

while($row = mysqli_fetch_assoc($result)){

    echo $row['certificate_no']."\t";
    echo $row['customer_name']."\t";
    echo $row['mobile']."\t";
    echo $row['service_date']."\t";
    echo $row['expiry_date']."\t";
    echo $row['total_qty']."\t";
    echo $row['address']."\n";
}
?>