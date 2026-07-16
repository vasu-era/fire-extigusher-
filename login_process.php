<?php

session_start();

include "db.php";

$username = mysqli_real_escape_string($conn, $_POST['username']);
$password = md5($_POST['password']);

$sql = "SELECT * FROM users
        WHERE username='$username'
        AND password='$password'";

$result = mysqli_query($conn, $sql);

if(mysqli_num_rows($result) > 0)
{
    $_SESSION['login'] = true;
    $_SESSION['username'] = $username;

    header("Location: dashboard.php");
    exit;
}
else
{
    header("Location: login.php?error=1");
    exit;
}

?>