import {useState} from "react";
import {profile} from "../constants";

// EmailJS credentials live in .env (see .env.example).
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Shared by every contact form. send() resolves to 'sent', 'error', or 'mailto'
// (when EmailJS isn't configured, the visitor's email app is opened instead).
const useSendMessage = () => {
    const [status, setStatus] = useState('idle');

    const send = async ({ name, email, message }) => {
        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            const subject = encodeURIComponent(`Portfolio message from ${name}`);
            const body = encodeURIComponent(`${message}\n\n${name} (${email})`);
            window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
            return 'mailto';
        }

        setStatus('sending');
        try {
            const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: SERVICE_ID,
                    template_id: TEMPLATE_ID,
                    user_id: PUBLIC_KEY,
                    template_params: { name, email, message },
                }),
            });
            if (!res.ok) throw new Error('Request failed');
            setStatus('sent');
            return 'sent';
        } catch {
            setStatus('error');
            return 'error';
        }
    };

    return { status, send, reset: () => setStatus('idle') };
};

export default useSendMessage;
