interface TimeagoOptions {
    locale?: string | null;
}

interface TimeagoMetadata {
    date: Date;
    unit: Intl.RelativeTimeFormatUnit;
    next: number;
}

export function timeago(selector: string, options?: TimeagoOptions): () => void {
    const cache = new Map<HTMLElement, TimeagoMetadata>();
    const formatter = new Intl.RelativeTimeFormat(options?.locale || "", { numeric: "auto" });

    let task_id: number | undefined;

    const query_all = (el: HTMLElement) => el.querySelectorAll(selector);
    const is_html_element = (el: Node): el is HTMLElement => el instanceof HTMLElement;

    const try_track = (el: HTMLElement): boolean => {
        if (el.matches(selector) && !cache.has(el)) {
            let date = extract_date_value(el);
            if (date) {
                cache.set(el, { date, next: 0, unit: "second" });
                return true;
            }
        }

        return false;
    }

    const untrack = (el: HTMLElement): boolean => {
        let handled = cache.delete(el);

        for (let c of query_all(el)) {
            handled = cache.delete(c as HTMLElement) || handled;
        }

        return handled;
    }

    const process_tree = (el: HTMLElement): boolean => {
        let handled = try_track(el);
        for (let c of query_all(el)) {
            is_html_element(c) && (handled = try_track(c) || handled);
        }

        return handled;
    }

    const execute_task = (timeout: number = 0) => {
        clearInterval(task_id);

        task_id = setTimeout(() => {
            let now = Math.floor(Date.now() / 1000);
            let min = Number.MAX_SAFE_INTEGER;

            for (let [el, meta] of cache) {
                const next = calc_next_interval(now - (meta.date.getTime() / 1000));
                min = Math.min(min, next);

                if (now >= meta.next) {
                    const [distance, unit] = calc_distance(meta.date);

                    el.textContent = formatter.format(distance, unit);

                    meta.unit = unit;
                    meta.next = next + now;
                }
            }

            execute_task(min);
        }, timeout * 1000);
    }

    const observer = new MutationObserver(records => {
        let handled = false;

        for (let r of records) {
            for (let n of r.addedNodes) {
                is_html_element(n) && (handled = process_tree(n) || handled);
            }

            for (let n of r.removedNodes) {
                if (is_html_element(n)) {
                    for (let e of query_all(n)) {
                        handled = untrack(e as HTMLElement) || handled;
                    }
                }
            }

            if (r.type === "attributes") {
                if (is_html_element(r.target)) {
                    handled = cache.delete(r.target) || handled;
                    handled = try_track(r.target) || handled;
                }
            }
        }

        handled && execute_task();
    });

    process_tree(document.body);
    execute_task();

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
            "datetime",
            "data-datetime"
        ]
    });

    return () => {
        clearTimeout(task_id);
        observer.disconnect();
    };
}

function extract_date_value(el: HTMLElement): Date | null {
    const value = el.getAttribute("datetime")
        ?? el.dataset["datetime"]
        ?? "";

    const date = new Date(
        /^\d+$/.test(value) ? +value : value
    );

    return isNaN(date.getTime()) ? null : date;
}

function calc_next_interval(distance: number): number {
    let interval = 1;
    let remaining_seconds = (distance = Math.abs(distance));

    for (let v of [60, 60, 24]) {
        if (distance >= v) {
            distance /= v;
            interval *= v;
        }
        else {
            break;
        }
    }

    remaining_seconds = remaining_seconds % interval;
    remaining_seconds = remaining_seconds ? interval - remaining_seconds : interval;
    return Math.ceil(remaining_seconds);
}

function calc_distance(date: Date): [distance: number, unit: Intl.RelativeTimeFormatUnit] {
    // Average days per year: 97 leap days in 400 year
    // (365 * 400 + 97) / 400 == 365.2425
    const DaysInYear = 365.2425;
    const SecondsInMinute = 60;
    const SecondsInHour = 60 * SecondsInMinute;
    const SecondsInDay = 24 * SecondsInHour;
    const SecondsInWeek = 7 * SecondsInDay;
    const SecondsInYear = DaysInYear * SecondsInDay;
    const SecondsInMonth = SecondsInYear / 12;

    const ceil = Math.ceil;
    const seconds = ceil((date.getTime() - Date.now()) / 1000);
    const seconds_abs = Math.abs(seconds);

    if (seconds_abs < SecondsInMinute) return [seconds, "second"];
    if (seconds_abs < SecondsInHour) return [ceil(seconds / SecondsInMinute), "minute"];
    if (seconds_abs < SecondsInDay) return [ceil(seconds / SecondsInHour), "hour"];
    if (seconds_abs < SecondsInWeek) return [ceil(seconds / SecondsInDay), "day"];
    if (seconds_abs < SecondsInMonth) return [ceil(seconds / SecondsInWeek), "week"];
    if (seconds_abs < SecondsInYear) return [ceil(seconds / SecondsInMonth), "month"];

    return [ceil(seconds / SecondsInYear), "year"];
}
