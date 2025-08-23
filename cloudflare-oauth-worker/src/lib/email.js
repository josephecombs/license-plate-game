import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { STATE_NAMES } from '../constants/states.js';

/**
 * Send email notification using AWS SES
 */
export async function sendEmailNotification(env, to, from, subject, body) {
	// Validate AWS credentials
	const accessKey = env.AWS_ACCESS_KEY_ID;
	const secretKey = env.AWS_SECRET_ACCESS_KEY;
	const region = 'us-east-1'; // Change this to your SES region

	if (!to || !from || !subject || !body) {
		const missingParams = [];
		if (!to) missingParams.push(`to=${to}`);
		if (!from) missingParams.push(`from=${from}`);
		if (!subject) missingParams.push(`subject=${subject}`);
		if (!body) missingParams.push(`body=${body}`);
		throw new Error(`Missing required email parameters: ${missingParams.join(', ')}`);
	}
	
	if (!accessKey || !secretKey) {
		throw new Error('AWS credentials not configured: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required');
	}
	
	// Create SES client
	const sesClient = new SESClient({
		region: region,
		credentials: {
			accessKeyId: accessKey,
			secretAccessKey: secretKey,
		},
	});
	
	// Create the email command
	const command = new SendEmailCommand({
		Source: from,
		Destination: {
			ToAddresses: [to],
		},
		Message: {
			Subject: {
				Data: subject,
			},
			Body: {
				Text: {
					Data: body,
				},
			},
		},
	});
	
	console.log('📧 Sending email via AWS SES...');
	console.log('📧 To:', to);
	console.log('📧 From:', from);
	console.log('📧 Subject:', subject);
	
	// Send the email - let AWS SES errors bubble up naturally
	const response = await sesClient.send(command);
	
	console.log('✅ Email sent successfully via AWS SES');
	console.log('📧 Message ID:', response.MessageId);
	return true;
}

/**
 * Send state change email notifications
 */
export async function sendStateChangeEmail(env, userEmail, userName, action, stateId, previousStates, newStates, notify = sendEmailNotification) {
	// Validate required parameters

	// console.log("ASdf");
	// throw 'asdf';
	if (!userEmail || !userName || !action || !stateId ) {
		throw new Error('Missing required parameters');
	}

	// Validate that previousStates and newStates are arrays
	if (!Array.isArray(previousStates) || !Array.isArray(newStates)) {
		throw new Error('Invalid parameters');
	}

	const stateName = STATE_NAMES[stateId] || stateId;
	const timestamp = new Date().toLocaleString();
	const previousCount = previousStates.length;
	const newCount = newStates.length;
	
	const subject = `Plate Chase - State ${action}: ${stateName}`;
	
	const body = `
Hello from Plate Chase!

${userName}

Details:
- Action: ${action}
- State: ${stateName}
- Previous total: ${previousCount} states
- New total: ${newCount} states
- Timestamp: ${timestamp}

Keep up the great work spotting those license plates!

Best regards,
The Plate Chase Team
`;

	// Log the email details for debugging
	console.log(`📧 Email notification:`);
	console.log(`   To: ${env.NOTIFICATION_EMAIL}`);
	console.log(`   From: support@platechase.com`);
	console.log(`   Subject: ${subject}`);

	// Debug all environment variables
	console.log('🔍 All env variables:', Object.keys(env));
	console.log(`🔑 AWS Access Key ID: ${env.AWS_ACCESS_KEY_ID ? env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
	console.log(`🔑 AWS Secret Access Key: ${env.AWS_SECRET_ACCESS_KEY ? env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
	console.log(`📧 Notification Email: ${env.NOTIFICATION_EMAIL || 'NOT SET'}`);

	// Send email notification - let errors bubble up to caller
	await notify(env, env.NOTIFICATION_EMAIL, 'support@platechase.com', subject, body);
	console.log(`✅ Email notification sent for ${action} of ${stateName} by ${userEmail}`);
}
