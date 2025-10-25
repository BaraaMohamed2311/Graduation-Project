

        function getDayOfWeekByDate(consultation_date) {
            const daysOfWeek = [
          "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ];

        const dateObj = new Date(consultation_date);
        const day_by_date = daysOfWeek[dateObj.getUTCDay()];

        return day_by_date;
        }


        module.exports = getDayOfWeekByDate;