// tslint:disable-next-line: max-line-length
export const confirmMail = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta name="viewport" content="width=device-width"/>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 16px;
            color: #1C232B;
            background-color: #fdfdfd;
            margin: 0;
            padding: 0;
            text-align: left;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #f0f0f0;
            padding: 30px;
        }
        .header img {
            height: 30px;
        }
        h2 {
            color: #294661;
            font-weight: 300;
            font-size: 24px;
        }
        p {
            color: #294661;
            font-size: 16px;
            font-weight: 300;
            line-height: 1.5;
        }
        .code {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: #294661;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 1px dashed #294661;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #294661;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="--ProjectLink--">
                <img src="--ProjectLogo--" alt="--ProjectName--">
            </a>
        </div>
        <h2>Hey --PersonName-- 👋,<br>Thanks for joining <b>--ProjectName--</b>!</h2>
        <p>Let’s confirm your email address. Use the following code to complete your verification:</p>
        <div class="code">--VerificationCode--</div>
        <p>By verifying your email, you agree to <b>--ProjectName--</b>'s 
            <a href="--TermsOfServiceLink--" style="color: --ProjectColor--;">Terms of Service</a>.
        </p>
        <div class="footer">
            <p>&copy; --ProjectName-- | --ProjectAddress--</p>
            <p>--Socials--</p>
        </div>
    </div>
</body>
</html>

`;
