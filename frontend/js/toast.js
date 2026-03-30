/*
Written By:
Joshua Iyalagha 40306001
 */

class Toast {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        this.container = document.getElementById('toast-container');
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type]};
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const icon = document.createElement('span');
        icon.style.fontSize = '20px';
        switch(type) {
            case 'success': icon.textContent = '✓'; break;
            case 'error': icon.textContent = '✗'; break;
            case 'warning': icon.textContent = '⚠'; break;
            default: icon.textContent = 'ℹ';
        }

        const text = document.createElement('span');
        text.textContent = message;
        text.style.color = '#333';
        text.style.flex = '1';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
            padding: 0 5px;
        `;
        closeBtn.onclick = () => toast.remove();

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(closeBtn);

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// adding animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// creating a global toast instance
window.toast = new Toast();