export const enterpriseStatusTemplate = (
    projectName: string,
    projectLogo: string,
    projectUrl: string,
    projectAddress: string,
    socials: string,
    enterpriseName: string,
    status: string,
    message: string,
    reason?: string
) => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:${process.env.PROJECT_COLOR};padding:24px 0;text-align:center;">
            <img src="${projectLogo}" alt="${projectName} Logo" style="height:48px;">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 24px 40px;">
            <h2 style="color:#222;font-size:22px;margin:0 0 12px 0;">${status}</h2>
            <p style="color:#444;font-size:16px;margin:0 0 16px 0;">${message}</p>
            ${
                reason
                    ? `<div style="background:#f8d7da;color:#721c24;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
                        <strong>Reason:</strong> ${reason}
                       </div>`
                    : ''
            }
            <p style="color:#888;font-size:13px;margin:24px 0 0 0;">If you have questions, please contact our support team.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 24px 40px;">
            <div style="border-top:1px solid #eee;padding-top:16px;">
              <span style="font-size:12px;color:#888;">${projectAddress}</span>
              <div style="margin-top:8px;">${socials}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f6f6f6;text-align:center;padding:16px 0;font-size:12px;color:#aaa;">
            &copy; ${new Date().getFullYear()} <a href="${projectUrl}" style="color:#3498db;text-decoration:none;">${projectName}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
