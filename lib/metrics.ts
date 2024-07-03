const indev = process.env.NODE_ENV === 'development';

import config from '../config'
import promClient from 'prom-client';

const register = new promClient.Registry();
register.setDefaultLabels({
    app: 'monitoring-article',
});

export const promTrack = async (
    metric: string,
    value: number,
    labels: object
) => {
    if (indev) {
        console.log('Tracking Metric:',);
        return;
    }
    try {
        // register something
    } catch (error) {
        console.log('Analytics error:', error.toString())
    }
}