export const jobExpirationMail = `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width" />
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
          font-size: 18px;
          font-weight: bold;
          color: #294661;
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          border: 1px dashed #294661;
      }
      .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: 500;
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
          <img src="--ProjectLogo--" alt="--ProjectName--" />
        </a>
      </div>
      <h2>Hello --EnterpriseName-- 👋,<br />Job Expiration Notice</h2>
      <p>We wanted to inform you that your job listing has expired:</p>
      <div class="code">
        <p style="margin: 0;">Position: --JobTitle--</p>
        <p style="margin: 5px 0;">Job ID: --JobID--</p>
        <p style="margin: 0;">Expired on: --ExpirationDate--</p>
      </div>
      <p>
        If you'd like to renew this job listing or post a new position, please
        visit your dashboard:
      </p>
      <div style="text-align: center;">
        <a href="--DashboardLink--" class="button">Go to Your Jobs</a>
      </div>
      <p>
        Thank you for using <b>--ProjectName--</b> for your recruitment needs.
        If you have any questions, please contact our support team.
      </p>
      <div class="footer">
        <p>&copy; --ProjectName-- | --ProjectAddress--</p>
        <p>--Socials--</p>
      </div>
    </div>
  </body>
</html>
`;
