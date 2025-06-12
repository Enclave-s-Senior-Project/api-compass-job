export const applyJobToEnterprise = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta name="viewport" content="width=device-width"/>
    <title>Job Application Notification</title>
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
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            height: 30px;
        }
        h2 {
            color: #294661;
            font-weight: 300;
            font-size: 24px;
            margin-top: 0;
        }
        h3 {
            color: #294661;
            font-weight: 300;
            font-size: 18px;
        }
        p {
            color: #294661;
            font-size: 16px;
            font-weight: 300;
            line-height: 1.5;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: --ProjectColor--;
            color: #ffffff !important;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
        }
        .button:hover {
            background-color: #1557b0;
        }
        .cover-letter {
            display: block;
            margin-top: 10px;
            color: #294661;
            line-height: 1.5;
            font-size: 16px;
            font-weight: 300;
        }
        .cover-letter p, .cover-letter ul, .cover-letter li, .cover-letter b, .cover-letter i, .cover-letter strong, .cover-letter em {
            color: #294661;
            font-size: 16px;
            line-height: 1.5;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #294661;
            margin-top: 20px;
        }
        .footer a {
            color: --ProjectColor--;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 10px auto;
                padding: 20px;
            }
            .button {
                padding: 8px 16px !important;
                font-size: 14px !important;
            }
            .cover-letter {
                font-size: 14px;
            }
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
        <h2>Dear --PersonName--,</h2>
        <p>A new application has been submitted for the <strong>{{jobTitle}}</strong> position at <strong>--ProjectName--</strong>. We appreciate your attention to this application.</p>
        <h3>Applicant Information</h3>
        <p>
            <strong>Name:</strong> {{applicantName}}<br>
            <strong>Email:</strong> <a href="mailto:{{applicantEmail}}" style="color: --ProjectColor--;">{{applicantEmail}}</a><br>
            <strong>Position:</strong> {{jobTitle}}
        </p>
        <h3>Application Materials</h3>
        <p>
            <strong>CV:</strong> <a href="{{cvLink}}" class="button">View CV</a><br>
            <strong>Cover Letter:</strong><br>
            <span class="cover-letter">{{coverLetter}}</span>
        </p>
        <p>Please review the application materials at your earliest convenience. You may contact the applicant directly via the email provided above.</p>
        <p>Best regards,<br>The --ProjectName-- Recruitment Team</p>
        <div class="footer">
            <p>© --ProjectName-- | --ProjectAddress--</p>
            <p>--Socials--</p>
            <p>For support, please contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
        </div>
    </div>
</body>
</html>`;
