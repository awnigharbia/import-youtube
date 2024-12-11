import axios from "axios";

// Telegram bot token and chat ID (replace with your actual values)
const TELEGRAM_BOT_TOKEN = '5492353089:AAGsxqFq9eJbupCxjsJTTHv9lZRsWheiITw';
const TELEGRAM_CHAT_ID = '5470199696';

// Function to send a message via Telegram
export async function sendTelegramMessage(message: string): Promise<void> {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
        });
        console.log('Telegram notification sent successfully.');
    } catch (error: any) {
        console.error('Failed to send Telegram notification:', error.message);
    }
}
