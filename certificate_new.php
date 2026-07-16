<?php
include 'db.php';

if (!isset($_GET['id']) || empty($_GET['id'])) {
    die("Error: Customer ID missing.");
}

$id = mysqli_real_escape_string($conn, $_GET['id']);

$result = mysqli_query($conn,"SELECT * FROM customers WHERE id='$id'");
$row = mysqli_fetch_assoc($result);

if (!$row) {
    die("Error: Certificate record not found.");
}

include "phpqrcode/qrlib.php";

// 🌐 1. Dynamic Server Domain ya LAN IP auto detect karne ka logic (Mobile Scanning ke liye safe)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];

// Dynamic URL structure jo scan hote hi open hoga
$link = $protocol . $domainName . "/FireSoftware/certificate_new.php?id=" . $row['id'];

if(!file_exists("qrcode")){
    mkdir("qrcode", 0777, true);
}

// ⚠️ FIX FOR ERROR: Slash (/) ko dash (-) se replace kiya file path ke liye
$safe_cert_no = str_replace('/', '-', $row['certificate_no']);
$file = "qrcode/" . $safe_cert_no . ".png";

QRcode::png($link, $file, QR_ECLEVEL_H, 6);
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Fire Service Certificate - <?php echo htmlspecialchars($row['customer_name']); ?></title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial, Helvetica, sans-serif;
}

body{
    background:#e5e5e5;
    padding:15px;
}

/* 🌟 Strictly locked to 1 Single A4 Page */
.certificate{
    width:210mm;
    height:297mm; 
    max-height:297mm; /* Force stop page overflow */
    margin:auto;
    background:#fff;
    border:10px double #0D47A1;
    border-radius:14px;
    padding:25px 35px; /* Compact padding to save vertical space */
    position:relative;
    overflow:hidden; /* Extra data will not create 2nd page */
    box-shadow:0 0 20px rgba(0,0,0,.2);
    
    /* Content distribution */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* Watermark */
.watermark{
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:360px;
    opacity:0.25; 
    z-index:0;
}

/* Header - Made slightly compact */
.header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:4px solid #0D47A1;
    padding-bottom:10px;
    position:relative;
    z-index:1;
}

.logo-area{
    width:100px;
}
.logo{
    width:100%;
    height: auto;
}

.company{
    flex:1;
    text-align:center;
}

.company h1{
    color:#0D47A1;
    font-size:26px;
    margin-bottom:5px;
    letter-spacing:1px;
}

.company p{
    font-size:13px;
    color:#333;
    line-height:18px;
}

/* Title */
.title{
    margin:12px 0;
    background:#0D47A1;
    color:#fff;
    text-align:center;
    font-size:20px;
    font-weight:900; 
    padding:8px;
    border-radius:6px;
    letter-spacing:1px;
    position:relative;
    z-index:1;
}

/* Remarks Node */
.remarks{
    margin-bottom:12px;
    border-left:5px solid #0D47A1;
    background:#f7f7f7;
    padding:10px 15px;
    position:relative;
    z-index:1;
}

.remarks h3{
    color:#0D47A1;
    margin-bottom:4px;
    font-size: 15px;
}
.remarks p{
    font-size: 13px;
}

/* Customer Table - Tight padding */
.info{
    width:100%;
    border-collapse:collapse;
    margin-bottom:12px;
    position:relative;
    z-index:1;
}

.info td{
    border:1px solid #999;
    padding:8px;
    font-size:14px;
    background: transparent !important;
}

.info b{
    color:#0D47A1;
}

/* Equipment Breakdown Table - Optimized for high number of rows */
.details{
    width:100%;
    border-collapse:collapse;
    position:relative;
    z-index:1;
}

.details th{
    background:#0D47A1 !important;
    color:white !important;
    padding:8px;
    font-size:14px;
}

/* 🌟 If items grow, font and padding scale down automatically */
.details td{
    border:1px solid #999;
    padding:6px 10px; 
    text-align:center;
    font-size:13px; 
    background: transparent !important;
}

/* Total Box */
.total-box{
    margin-top:10px;
    background:#0D47A1 !important;
    color:white !important;
    padding:10px;
    font-size:16px; 
    font-weight:900; 
    text-align:right;
    border-radius:6px;
    position:relative;
    z-index:1;
}

/* Footer Execution Signatures */
.footer{
    display:flex;
    justify-content:flex-end;
    align-items:flex-end;
    margin-top: 10px;
    position:relative;
    z-index:1;
}

.signature{
    text-align:center;
    width: 180px;
}

.signature img{
    width:140px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto;
}

.signature b{
    color:#0D47A1;
    font-size: 13px;
}

.bottom{
    text-align:center;
    margin-top: 10px;
    font-size:13px;
    color:#444;
}

.qr{
    width:100px;
    text-align:right;
}

.qr img{
    width:85px;
    height:85px;
    border:2px solid #0d47a1;
    padding:4px;
    background:#fff;
}

.no-print-btn {
    display:block;
    margin:20px auto;
    padding:12px 30px;
    background:#0D47A1;
    color:#fff;
    border:none;
    border-radius:8px;
    cursor:pointer;
    font-size:16px;
    font-weight: bold;
}

/* =======================================================
    🖨️ FORCE SINGLE PAGE PRINT WITH CSS SCALING PROTECTION
   ======================================================= */
@media print{
    @page {
        size: A4 portrait;
        margin: 0mm; /* Browser default margins removed */
    }
    
    html, body {
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        width: 210mm;
        height: 297mm;
        overflow: hidden; /* Hard restriction: strictly blocks 2nd page generation */
    }

    body{
        padding: 0 !important;
        margin: 0 !important;
    }

    .no-print-btn, hr {
        display:none !important;
    }

    .certificate{
        box-shadow: none !important;
        border: 10px double #0D47A1 !important;
        border-radius: 0px !important;
        width: 210mm !important;
        height: 297mm !important;
        padding: 25px 35px !important;
        transform: scale(1);
        transform-origin: top center;
    }
    
    .watermark {
        opacity: 0.22 !important;
    }
}
</style>
</head>
<body>

<div class="certificate">

    <!-- Watermark Background Layer -->
    <img src="water.jpg" class="watermark">

    <!-- Header Section -->
    <div class="header">
        <div class="logo-area">
            <img src="logo.png" class="logo">
        </div>

        <div class="company">
            <h1>RAKESH GAS SUPPLIERS</h1>
            <p>
                Opp. Reliance Petrol Pump,<br>
                Rajkot Road, Dolatpara,<br>
                Junagadh - 362001
            </p>
            <p>
                Mobile : 93775 48793 | GST : 24AFVPA4036L1ZB
            </p>
        </div>

        <div class="qr">
            <img src="<?php echo $file; ?>">
        </div>
    </div>

    <!-- Document Title -->
    <div class="title">
        FIRE EXTINGUISHER CERTIFICATE
    </div>

    <!-- Service Remarks Section -->
    <div class="remarks">
        <h3>Service Remarks</h3>
        <p>
            All Fire Extinguishers have been inspected, serviced, refilled and tested as per Fire Safety Standards.
        </p>
    </div>

    <!-- Customer Profile Data Elements -->
    <table class="info">
        <tr>
            <td style="width:20%;"><b>Certificate No</b></td>
            <td style="width:30%;"><?php echo htmlspecialchars($row['certificate_no']); ?></td>
            <td style="width:20%;"><b>Issue Date</b></td>
            <td style="width:30%;"><?php echo date("d/m/Y",strtotime($row['service_date'])); ?></td>
        </tr>
        <tr>
            <td><b>Customer Name</b></td>
            <td><?php echo htmlspecialchars($row['customer_name']); ?></td>
            <td><b>Expiry Date</b></td>
            <td><?php echo date("d/m/Y",strtotime($row['expiry_date'])); ?></td>
        </tr>
        <tr>
            <td><b>Mobile</b></td>
            <td colspan="3"><?php echo htmlspecialchars($row['mobile']); ?></td>
        </tr>
        <tr>
            <td><b>Address</b></td>
            <td colspan="3"><?php echo htmlspecialchars($row['address']); ?></td>
        </tr>
    </table>

    <!-- Dynamic Equipment Table Specs -->
    <table class="details">
        <thead>
            <tr>
                <th width="50%">Type</th>
                <th width="25%">Capacity</th>
                <th width="25%">Qty</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $extResult = mysqli_query($conn, "SELECT * FROM extinguisher_details WHERE customer_id='$id'");
            while($ext = mysqli_fetch_assoc($extResult)) {
            ?>
            <tr>
                <td><?php echo htmlspecialchars($ext['ext_type']); ?></td>
                <td><?php echo htmlspecialchars($ext['ext_capacity']); ?></td>
                <td><?php echo htmlspecialchars($ext['ext_qty']); ?> Nos</td>
            </tr>
            <?php } ?>
        </tbody>
    </table>
    
    <!-- Aggregate Quantity Count -->
    <div class="total-box">
        TOTAL QUANTITY : <?php echo htmlspecialchars($row['total_qty']); ?> Nos
    </div>

    <!-- Document Footer Auth Operations -->
    <div class="footer">
        <div class="signature">
            <img src="sign.png">
            <b>Authorized Signature</b>
        </div>
    </div>

    <div class="bottom">
        <b>THANK YOU FOR CHOOSING RAKESH GAS SUPPLIERS</b>
    </div>
</div>

<!-- Print Triggers -->
<button class="no-print-btn" onclick="window.print()">🖨️ Print Certificate</button>

<script src="fire.js"></script>

<script>
    window.onload = function() {
        setTimeout(function() {
            window.print();
        }, 500);
    };
</script>

</body>
</html>