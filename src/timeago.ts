interface TimeagoOptions {
    locale?: string | null;
}

export function timeago(selector: string, options?: TimeagoOptions): () => void {
    const formatter = new Intl.RelativeTimeFormat(options?.locale || "", { numeric: "auto" });

    function process() {
        for (let el of document.querySelectorAll(selector)) {
            if (el instanceof HTMLElement) {
                let date = get_date(el);
                if (date) {
                    const [distance, unit] = calculate_distance(date);
                    const result = formatter.format(distance, unit);
                    result !== el.textContent && (el.textContent = result);
                }
            }
        }
    }

    const timer_id = setInterval(process, 1000);
    return () => clearInterval(timer_id);
}

function get_date(el: HTMLElement): Date | null {
    const value = el.getAttribute("datetime")
        ?? el.dataset["datetime"]
        ?? "";

    const date = new Date(
        /^\d+$/.test(value) ? +value : value
    );

    return isNaN(date.getTime()) ? null : date;
}

function calculate_distance(date: Date): [distance: number, unit: Intl.RelativeTimeFormatUnit] {
    // Average days per year: 97 leap days in 400 year
    const DaysInYear = (365 * 400 + 97) / 400;
    const SecondsInMinute = 60;
    const SecondsInHour = 60 * SecondsInMinute;
    const SecondsInDay = 24 * SecondsInHour;
    const SecondsInWeek = 7 * SecondsInDay;
    const SecondsInYear = DaysInYear * SecondsInDay;
    const SecondsInMonth = SecondsInYear / 12;

    const round = Math.round;
    const seconds = round((date.getTime() - Date.now()) / 1000);
    const seconds_abs = Math.abs(seconds);

    if (seconds_abs < SecondsInMinute) return [seconds, "second"];
    if (seconds_abs < SecondsInHour) return [round(seconds / SecondsInMinute), "minute"];
    if (seconds_abs < SecondsInDay) return [round(seconds / SecondsInHour), "hour"];
    if (seconds_abs < SecondsInWeek) return [round(seconds / SecondsInDay), "day"];
    if (seconds_abs < SecondsInMonth) return [round(seconds / SecondsInWeek), "week"];
    if (seconds_abs < SecondsInYear) return [round(seconds / SecondsInMonth), "month"];

    return [round(seconds / SecondsInYear), "year"];
}
