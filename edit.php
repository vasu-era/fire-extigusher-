<?php
include 'db.php';

$id = $_GET['id'];

$result = mysqli_query($conn, "SELECT * FROM customers WHERE id='$id'");
$row = mysqli_fetch_assoc($result);

// Date formatting checklist for safety
$db_date = $row['service_date'];
$formatted_date = (!empty($db_date) && $db_date != '0000-00-00') ? date('Y-m-d', strtotime($db_date)) : ''; 

$db_expiry = $row['expiry_date'];
$formatted_expiry = (!empty($db_expiry) && $db_expiry != '0000-00-00') ? date('Y-m-d', strtotime($db_expiry)) : ''; 

// Duration fetch (Default 12 agar blank ho)
$db_duration = !empty($row['expiry_duration']) ? $row['expiry_duration'] : '12';
?>

<!DOCTYPE html>
<html>
<head>
    <title>RAKESH GAS SUPPLIERS - Edit Customer</title>
    <link rel="stylesheet" href="fire.css">
    <style>
        /* Action buttons aur delete style ke liye extra utility rules */
        .btn-delete-row {
            background: #d32f2f;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
        }
        .btn-delete-row:hover {
            background: #b71c1c;
        }
        .action-th-td {
            text-align: center;
            width: 80px;
        }
    </style>
</head>
<body>

<div class="container">

    <div class="logo-title">
        <h1>RAKESH GAS SUPPLIERS</h1>
        <p>Fire Extinguisher Service Management System (Edit Mode)</p>
    </div>

    <form id="customerForm" action="update.php" method="POST">

        <input type="hidden" name="id" value="<?php echo $row['id']; ?>">

        <div class="form-grid">

            <div class="form-group">
                <label>Customer Name <span class="required">*</span></label>
                <input type="text" name="customer_name" value="<?php echo $row['customer_name']; ?>" required>
            </div>

            <div class="form-group">
                <label>Mobile Number<span class="required">*</span></label>
                <input type="tel" name="mobile" value="<?php echo $row['mobile']; ?>" placeholder="Enter 10 Digit no." pattern="[0-9]{10}" maxlength="10" required>
            </div>
            
            <div class="form-group full-width">
                <label>Address<span class="required">*</span></label>
                <textarea name="address" rows="2" required><?php echo $row['address']; ?></textarea>
            </div>
            
            <div class="form-group">
                <label>Certificate Number<span class="required">*</span></label>
                <input type="text" id="certificate_no" name="certificate_no" value="<?php echo $row['certificate_no']; ?>" readonly required>
            </div>
            
            <!-- 📅 Issue Date -->
            <div class="form-group">
                <label>Issue Date<span class="required">*</span></label>
                <input type="date" id="service_date" name="service_date" value="<?php echo $row['service_date']; ?>" onchange="calculateExpiryDate()" required>
            </div>

           <!-- ⏳ Validity Duration -->
            <div class="form-group">
                <label>Validity Duration<span class="required">*</span></label>
                <select id="expiry_duration" name="expiry_duration" onchange="calculateExpiryDate()" required>
                    <?php 
                    $current_duration = isset($row['duration']) ? $row['duration'] : (isset($row['expiry_duration']) ? $row['expiry_duration'] : '12');
                    ?>
                    <option value="12" <?php if($current_duration == '12') echo 'selected'; ?>>1 Year (Standard)</option>
                    <option value="6" <?php if($current_duration == '6') echo 'selected'; ?>>6 Month</option>
                    <option value="24" <?php if($current_duration == '24') echo 'selected'; ?>>2 Years</option>
                    <option value="36" <?php if($current_duration == '36') echo 'selected'; ?>>3 Years</option>
                    <option value="60" <?php if($current_duration == '60') echo 'selected'; ?>>5 Years</option>
                </select>
            </div>
            
            <!-- 🔒 Expiry Date -->
            <div class="form-group">
                <label>Expiry Date*</label>
                <?php 
                $expiry_display = (!empty($row['expiry_date']) && $row['expiry_date'] != '0000-00-00') ? date('m/d/Y', strtotime($row['expiry_date'])) : '';
                ?>
                <input type="text" id="expiry_date" name="expiry_date" value="<?php echo $expiry_display; ?>" readonly>
            </div>

            <div class="form-group full-width">
                <h3>Extinguisher Details<span class="required">*</span></h3>

                <table id="extinguisherTable">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Capacity</th>
                            <th>Qty</th>
                            <th>Service Type</th> 
                            <th>Amount</th>
                            <th class="action-th-td">Action</th>
                        </tr>
                    </thead>
                    <tbody id="extinguisherTbody"> <!-- 🌟 Dynamic Target Handler Body -->
                        <?php
                        $extResult = mysqli_query($conn, "SELECT * FROM extinguisher_details WHERE customer_id='$id'");
                        
                        if(mysqli_num_rows($extResult) > 0) {
                            while($ext = mysqli_fetch_assoc($extResult)) {
                                // 🔄 Check karenge ki pehle se database me kya select tha (default: refilling)
                                $service_type = isset($ext['service_action_type']) ? $ext['service_action_type'] : 'refilling';
                                
                                // 💰 Price fields ko handle karne ka dynamic style logic
                                $ref_price = isset($ext['ext_refilling_price']) ? $ext['ext_refilling_price'] : '';
                                $new_price = isset($ext['ext_new_price']) ? $ext['ext_new_price'] : '';
                                
                                $ref_display = ($service_type === 'new') ? 'display: none;' : 'display: block;';
                                $new_display = ($service_type === 'new') ? 'display: block;' : 'display: none;';
                        ?>
                        <tr>
                            <td>
                                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                                    <option value="ABC" <?php if($ext['ext_type'] == 'ABC') echo 'selected'; ?>>ABC Powder</option>
                                    <option value="CO2" <?php if($ext['ext_type'] == 'CO2') echo 'selected'; ?>>CO2</option>
                                    <option value="Water" <?php if($ext['ext_type'] == 'Water') echo 'selected'; ?>>Water</option>
                                    <option value="Foam" <?php if($ext['ext_type'] == 'Foam') echo 'selected'; ?>>Foam</option>
                                </select>
                            </td>

                            <td>
                                <select name="ext_capacity[]" class="capacity" required>
                                    <option value="<?php echo $ext['ext_capacity']; ?>" selected><?php echo $ext['ext_capacity']; ?></option>
                                </select>
                            </td>

                            <td>
                                <input type="number" name="ext_qty[]" class="ext-qty" value="<?php echo $ext['ext_qty']; ?>" min="1" oninput="calculateTotalQty()" required>
                            </td>

                            <!-- 🔄 1. Service Type Dropdown -->
                            <td>
                                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                                    <option value="refilling" <?php if($service_type == 'refilling') echo 'selected'; ?>>Refilling Only</option>
                                    <option value="new" <?php if($service_type == 'new') echo 'selected'; ?>>New Bottle/Sale</option>
                                </select>
                            </td>
                            
                            <!-- 💰 2. Amount Input Fields -->
                            <td>
                                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01" value="<?php echo $ref_price; ?>" style="<?php echo $ref_display; ?>">
                                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" value="<?php echo $new_price; ?>" style="<?php echo $new_display; ?>">
                            </td>

                            <td class="action-th-td">
                                <button type="button" class="btn-delete-row" onclick="deleteThisRow(this)">✕</button>
                            </td>
                        </tr>
                        <?php 
                            }
                        } else { 
                            // Agar database me koi record nahi mila toh empty default row
                        ?>
                        <tr>
                            <td>
                                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                                    <option value="">Select Type</option>
                                    <option value="ABC">ABC Powder</option>
                                    <option value="CO2">CO2</option>
                                    <option value="Water">Water</option>
                                    <option value="Foam">Foam</option>
                                </select>
                            </td>
                            <td>
                                <select name="ext_capacity[]" class="capacity" required>
                                    <option value="">Select Capacity</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" name="ext_qty[]" class="ext-qty" value="1" min="1" oninput="calculateTotalQty()" required>
                            </td>
                            
                            <td>
                                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                                    <option value="refilling">Refilling Only</option>
                                    <option value="new">New Bottle/Sale</option>
                                </select>
                            </td>
                            
                            <td>
                                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01">
                                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" style="display: none;">
                            </td>

                            <td class="action-th-td">
                                <button type="button" class="btn-delete-row" onclick="deleteThisRow(this)">✕</button>
                            </td>
                        </tr>
                        <?php } ?>
                    </tbody>
                </table>

                <div style="margin-top: 10px;">
                    <button type="button" class="add-btn" onclick="customAddRow()">+ Add Extinguisher</button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Total Qty.<span class="required">*</span></label>
                <input type="text" id="total_qty" name="total_qty" value="<?php echo !empty($row['total_qty']) ? $row['total_qty'] : '1'; ?>" readonly required>
            </div>

        </div>

        <button type="submit" class="save-btn">UPDATE CUSTOMER DETAILS</button>

    </form>
</div>

<script src="fire.js"></script>
<script>
    // 🔄 NEW FUNCTION: Dynamic hidden/visible logic for prices
    function togglePriceFields(selectElement) {
        var row = selectElement.closest('tr');
        var refInput = row.querySelector('.ref-input');
        var newInput = row.querySelector('.new-input');
        
        if (selectElement.value === 'new') {
            refInput.style.display = 'none';
            refInput.value = ''; 
            newInput.style.display = 'block';
        } else {
            newInput.style.display = 'none';
            newInput.value = ''; 
            refInput.style.display = 'block';
        }
    }

    // 🚀 FIXED FUNCTION: Dynamic added row structural format mapping with all fields
    function customAddRow() {
        let tbody = document.getElementById('extinguisherTbody') || document.querySelector('#extinguisherTable tbody');
        let tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>
                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                    <option value="">Select Type</option>
                    <option value="ABC">ABC Powder</option>
                    <option value="CO2">CO2</option>
                    <option value="Water">Water</option>
                    <option value="Foam">Foam</option>
                </select>
            </td>
            <td>
                <select name="ext_capacity[]" class="capacity" required>
                    <option value="">Select Capacity</option>
                </select>
            </td>
            <td>
                <input type="number" name="ext_qty[]" class="ext-qty" value="1" min="1" oninput="calculateTotalQty()" required>
            </td>
            <td>
                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                    <option value="refilling">Refilling Only</option>
                    <option value="new">New Bottle/Sale</option>
                </select>
            </td>
            <td>
                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01">
                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" style="display: none;">
            </td>
            <td class="action-th-td">
                <button type="button" class="btn-delete-row" onclick="deleteThisRow(this)">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
        calculateTotalQty();
    }

    // 🚀 Particular row delete selector
    function deleteThisRow(button) {
        let tbody = document.getElementById('extinguisherTbody') || document.querySelector('#extinguisherTable tbody');
        let rows = tbody.getElementsByTagName('tr');
        
        if (rows.length > 1) {
            button.closest('tr').remove();
            calculateTotalQty(); 
        } else {
            alert("At least one item is required!");
        }
    }

    // 🎯 SMART LOAD & DATE INITS
    window.onload = function() {
        calculateTotalQty(); 
        
        let issueDateInput = document.getElementById('service_date');
        let durationInput = document.getElementById('expiry_duration');

        if (issueDateInput) {
            if(typeof calculateExpiryDate === "function") {
                calculateExpiryDate();
            }
            issueDateInput.addEventListener('input', calculateExpiryDate);
            issueDateInput.addEventListener('change', calculateExpiryDate);
        }
        if (durationInput) {
            durationInput.addEventListener('change', calculateExpiryDate);
        }
    };

    // ⌨️ Ctrl + S shortcut for Edit Form
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault(); 
            let submitButton = document.querySelector('.save-btn');
            if (submitButton) {
                submitButton.click();
            }
        }
    });

    // SPECIAL EDIT EXIT: Esc key rule
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            window.location.href = 'customers.php'; 
        }
    });
</script>

</body>
</html>