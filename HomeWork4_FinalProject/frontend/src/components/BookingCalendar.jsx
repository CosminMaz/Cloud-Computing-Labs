import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales: { 'en-US': enUS },
});

const STATUS_COLORS = {
    pending:   '#f59e0b',
    confirmed: '#6366f1',
    completed: '#22c55e',
    cancelled: '#ef4444',
};

export default function BookingCalendar({ bookings, onSelectDay }) {
    const [date, setDate] = useState(new Date());

    const events = useMemo(() =>
        bookings
            .filter(b => b.status !== 'cancelled')
            .map(b => {
                const start = new Date(b.scheduled_at);
                const endOfDay = new Date(start);
                endOfDay.setHours(23, 59, 59, 999);
                const end = new Date(Math.min(start.getTime() + 60 * 60 * 1000, endOfDay.getTime()));
                return {
                    id: b.id,
                    title: `${b.service_type || 'Booking'}${b.client_name ? ` · ${b.client_name}` : ''}`,
                    start,
                    end,
                    resource: b,
                };
            }),
        [bookings]
    );

    const eventPropGetter = (event) => ({
        style: {
            backgroundColor: STATUS_COLORS[event.resource.status] || '#6366f1',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '0.75rem',
        },
    });

    const handleSelectSlot = ({ start }) => onSelectDay(start, null);
    const handleSelectEvent = (event) => onSelectDay(new Date(event.resource.scheduled_at), event.resource);

    return (
        <div className="rbc-dark" style={{ height: 560 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventPropGetter}
                views={['month']}
                view="month"
                date={date}
                onNavigate={setDate}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                drilldownView={null}
                popup
            />
        </div>
    );
}
