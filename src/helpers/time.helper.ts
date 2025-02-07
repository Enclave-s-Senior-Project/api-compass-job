export class TimeHelper {
    /**
     * To convert short hand time ('s', 'm', 'h', 'd') to milliseconds
     * @param shorthandTime {string}
     * @returns number
     */
    public static shorthandToMs(shorthandTime: string) {
        if (shorthandTime.includes('s')) return Number(shorthandTime.split('s')[0]) * 1000;
        else if (shorthandTime.includes('m')) return Number(shorthandTime.split('m')[0]) * 60 * 1000;
        else if (shorthandTime.includes('h')) return Number(shorthandTime.split('h')[0]) * 60 * 60 * 1000;
        else if (shorthandTime.includes('d')) return Number(shorthandTime.split('d')[0]) * 24 * 60 * 60 * 1000;
        else throw Error("Short hand time must include number and the shorthand ('s', 'm', 'h', 'd')"); // default to 0 ms if no valid time unit provided
    }
}
