export const reopenJobMail = `<!doctype html>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Job Reopened Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header img {
                max-width: 200px;
                height: auto;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #777;
            }
            .button {
                display: inline-block;
                background-color: #3498db;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-top: 15px;
            }
            .job-details {
                background-color: #fff;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin: 15px 0;
            }
            .social-links {
                margin-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="--ProjectLink--" target="_blank">
                    <img src="--ProjectLogo--" alt="--ProjectName-- Logo" />
                </a>
            </div>

            <div class="content">
                <h2>Job Posting Reopened</h2>
                <p>Dear --EnterpriseName--,</p>

                <p>
                    We are pleased to inform you that your job posting <strong>--JobTitle--</strong> has been reopened
                    on our platform.
                </p>

                <div class="job-details">
                    <p><strong>Job Details:</strong></p>
                    <ul>
                        <li><strong>Job Title:</strong> --JobTitle--</li>
                        <li><strong>Job ID:</strong> --JobID--</li>
                    </ul>
                </div>

                <p>Your job is now visible to candidates and will appear in search results.</p>

                <p>You can make any necessary updates to your job posting by visiting your dashboard.</p>

                <div style="text-align: center">
                    <a href="--DashboardLink--" class="button" target="_blank">Go to Dashboard</a>
                </div>

                <p>Thank you for using --ProjectName-- for your recruiting needs.</p>

                <p>Best regards,<br />The --ProjectName-- Team</p>
            </div>

            <div class="footer">
                <p>--ProjectName-- | --ProjectAddress--</p>
                <div class="social-links">--Socials--</div>
                <p>© 2023 --ProjectName--. All rights reserved.</p>
            </div>
        </div>
    </body>
</html>
`;
