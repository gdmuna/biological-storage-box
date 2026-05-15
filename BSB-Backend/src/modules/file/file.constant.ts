/** 代理下载时，≤ 此阈值使用 Buffer（内存读取），> 此阈值使用 Stream（流式传输）。 */
export const PROXY_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5 MB
