<?php

include 'db.php';

$result = mysqli_query($conn,"
SELECT *
FROM customers
WHERE expiry_date BETWEEN CURDATE()
AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY expiry_date ASC
");

?>

<!DOCTYPE html>
<html>
<head>
<title>Expiry Due Customers</title>

<style>

body{
    font-family:Arial;
    padding:20px;
}

table{
    width:100%;
    border-collapse:collapse;
}

th,td{
    border:1px solid #ddd;
    padding:10px;
    text-align:left;
}

th{
    background:#dc2626;
    color:white;
}

</style>

</head>

<body>

<h2>⏰ Expiry Due Customers (Next 30 Days)</h2>

<table>

<tr>
    <th>Certificate No</th>
    <th>Customer Name</th>
    <th>Mobile</th>
    <th>Expiry Date</th>
</tr>

<?php while($row=mysqli_fetch_assoc($result)){ ?>

<tr>

<td><?php echo $row['certificate_no']; ?></td>

<td><?php echo $row['customer_name']; ?></td>

<td><?php echo $row['mobile']; ?></td>

<td>
<?php echo date("d/m/Y",strtotime($row['expiry_date'])); ?>
</td>

</tr>

<?php } ?>

</table>
<script src="fire.js"></script>

</body>
</html>