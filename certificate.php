<?php

include 'db.php';

$id = $_GET['id'];

$result = mysqli_query(
$conn,
"SELECT * FROM customers WHERE id='$id'"
);

$row = mysqli_fetch_assoc($result);

?>

<!DOCTYPE html>
<html>
<head>

<title>Certificate</title>

<style>

body{
    font-family:Arial;
    padding:40px;
    background:#ddd;
}

.certificate{
    border:3px solid black;
    padding:30px;
    width:794px;
    margin:auto;
    background:white;
}

button{
    background:#003b8e;
    color:white;
    border:none;
    font-size:16px;
    border-radius:8px;
    padding:12px 30px;
    margin-top:20px;
    cursor:pointer;
}
button:hover{
    background:#002b66;
}
.certificate{
    position:relative;
    border:12px double #0d47a1;
    border-radius: 20px;
    padding:40px;
    background:#fff;
    overflow:hidden;
}

.header{
    display:flex;
    align-items:center;
    border-bottom:3px solid #0d47a1;
    padding-bottom:15px;
}

.logo{
    width:200px;
    margin-right:20px;
}

.company-info{
    flex:1;
    text-align:center;
}

.company-info h1{
    font-size:34px;
    color:#003b8e;
    margin-bottom:8px;
    letter-spacing:2px;
}

.title{
    text-decoration:underline;
    margin:25px 0;
    font-size:34px;
    font-weight:bold;
    letter-spacing:3px;
    color:#0d47a1;
}

.watermark{
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:450px;
    opacity:0.18;
    z-index:0;
}

.certificate p{
    margin:15px 0;
    font-size:18px;
    color:#444;
}
.certificate table,
.signature{
    position:relative;
    z-index:1;
}

.signature{
    text-align:right;
    margin-top:80px;
}

@media print{
button{
display:none;
}
}

</style>

</head>

<body>

<div class="certificate">
    <img src="water.jpg" class="watermark">

<div class="header">

    <img src="logo.png" class="logo">

    <div class="company-info">
        <h1>RAKESH GAS SUPPLIERS</h1>

        <p>
        Opp. Reliance Petrol Pump,
        Rajkot Road, Dolatpara,
        Junagadh - 362001
        </p>

        <p>
        Mo. 9898186219 |
        GST No. 24AFVPA4036L1ZB
        </p>

    </div>

</div>

<h2 class="title">CERTIFICATE</h2>

<p>
<b>Certificate No:</b>
<?php echo $row['certificate_no']; ?>
</p>

<p>
<b>Customer Name:</b>
<?php echo $row['customer_name']; ?>
</p>

<p>
<b>Mobile:</b>
<?php echo $row['mobile']; ?>
</p>

<p>
<b>Issue Date:</b>
<?php echo date("d/m/Y",strtotime($row['service_date'])); ?>
</p>

<p>
<b>Expiry Date:</b>
<?php echo date("d/m/Y",strtotime($row['expiry_date'])); ?>
</p>

<p>
<b>Total Qty:</b>
<?php echo $row['total_qty']; ?>
</p>

<p>
<b>Address:</b>
<?php echo $row['address']; ?>
</p>

<br><br>

<div class="signature">
<img src="sign.png" width="150">
<br>
<b> Authorized Signatory </b>
</div>

</div>

<button onclick="window.print()">
🖨 Print Certificate
</button>

</body>
</html>