<!DOCTYPE html>
<html>
<head>
<title>Login - RAKESH GAS SUPPLIERS</title>

<style>

    *{
        margin:0;
        padding:0;
        box-sizing:border-box;
        font-family:Arial;
    }

    body{
        background:#f3f6fb;
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
    }

    .login-box{

        width:380px;
        background:#fff;
        padding:35px;
        border-radius:12px;
        box-shadow:0 10px 25px rgba(0,0,0,.2);

    }

    h2{

        text-align:center;
        margin-bottom:10px;
        color:#0d47a1;

    }

    p{

        text-align:center;
        margin-bottom:25px;
        color:#555;

    }

    input{

        width:100%;
        padding:12px;
        margin-bottom:15px;
        border:1px solid #ccc;
        border-radius:6px;
        font-size:16px;

    }

    button{

        width:100%;
        padding:12px;
        border:none;
        background:#0d47a1;
        color:white;
        font-size:17px;
        cursor:pointer;
        border-radius:6px;

    }

    button:hover{

        background:#08306b;

    }

    .error{

        background:#ffebee;
        color:red;
        padding:10px;
        margin-bottom:15px;
        border-radius:5px;
        text-align:center;

    }

</style>

</head>

<body>

<div class="login-box">

<h2>RAKESH GAS SUPPLIERS</h2>

<p>Fire Extinguisher Management System</p>

<?php

if(isset($_GET['error']))
{

echo "<div class='error'>Invalid Username or Password</div>";

}

?>

<form action="login_process.php" method="POST">

<input
type="text"
name="username"
placeholder="Username"
required>

<input
type="password"
name="password"
placeholder="Password"
required>

<button type="submit">

LOGIN

</button>

</form>

</div>

</body>
</html>