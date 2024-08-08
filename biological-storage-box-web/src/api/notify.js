import { Snackbar } from '@varlet/ui';
import '@varlet/ui/es/snackbar/style/index';

const notify = {
    success: (message) => {
        Snackbar.success({
            content: message,
            type: 'success',
            position: 'top'
        });
    },
    error: (message) => {
        Snackbar.error({
            content: message,
            type: 'error',
            position: 'top'
        });
    },
    warning: (message) => {
        Snackbar.warning({
            content: message,
            type: 'warning',
            position: 'top'
        });
    },
    info: (message) => {
        Snackbar.info({
            content: message,
            type: 'info',
            position: 'top'
        });
    },
    primary: (message) => {
        Snackbar.primary({
            content: message,
            type: 'primary',
            position: 'top'
        });
    }
};

export default notify;
