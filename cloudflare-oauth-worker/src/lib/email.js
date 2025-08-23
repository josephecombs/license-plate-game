import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// State mapping for readable names
const STATE_NAMES = {
	'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
	'08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
	'12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
	'18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
	'23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
	'28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
	'33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
	'37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
	'41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
	'46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
	'51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
};

/**
 * Send email notification using AWS SES
 */
export async function sendEmailNotification(env, to, from, subject, body) {
	try {
		const accessKey = env.AWS_ACCESS_KEY_ID;
		const secretKey = env.AWS_SECRET_ACCESS_KEY;
		const region = 'us-east-1'; // Change this to your SES region
		
		if (!accessKey || !secretKey) {
			console.error('❌ AWS credentials not found');
			return false;
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
		
		// Send the email
		const response = await sesClient.send(command);
		
		console.log('✅ Email sent successfully via AWS SES');
		console.log('📧 Message ID:', response.MessageId);
		return true;
		
	} catch (error) {
		console.error('❌ Error sending email via AWS SES:', error);
		return false;
	}
}

/**
 * Send state change email notifications
 */
export async function sendStateChangeEmail(env, userEmail, userName, action, stateId, previousStates, newStates) {
	const stateName = STATE_NAMES[stateId] || stateId;
	const timestamp = new Date().toLocaleString();
	const previousCount = previousStates.length;
	const newCount = newStates.length;
	
	const subject = `Plate Chase - State ${action}: ${stateName}`;
	
	const body = `
Hello from Plate Chase!

${userName} (${userEmail}) has ${action.toLowerCase()} ${stateName} from their license plate collection.

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

	// Use the new sendEmailNotification function
	const success = await sendEmailNotification(env, env.NOTIFICATION_EMAIL, 'support@platechase.com', subject, body);

	if (success) {
		console.log(`✅ Email notification sent for ${action} of ${stateName} by ${userEmail}`);
	} else {
		console.error(`❌ Failed to send email notification for ${action} of ${stateName} by ${userEmail}`);
	}
}
