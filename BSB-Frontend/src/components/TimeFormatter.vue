<template>
    <span>{{ formattedTime }}</span>
</template>

<script>
export default {
    name: 'TimeFormatter',
    props: {
        time: {
            type: String,
            required: true
        },
        format: {
            type: String,
            default: 'YYYY-MM-DD HH:mm:ss'
        }
    },
    computed: {
        formattedTime() {
            if (!this.time) return '';

            // 创建Date对象
            const date = new Date(this.time);

            // 获取用户本地时区的时间字符串
            const localTimeString = date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false, // 使用24小时制
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // 自动获取用户时区
            });

            // 解析本地时间字符串
            const [datePart, timePart] = localTimeString.split(' ');
            const [year, month, day] = datePart.split('/');
            const [hours, minutes, seconds] = timePart.split(':');

            // 根据format属性返回不同格式
            if (this.format === 'YYYY-MM-DD') {
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        }
    }
};
</script>
