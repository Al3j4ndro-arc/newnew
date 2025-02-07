import React from "react";
import { useNavigate } from "react-router";

import EventCheckInForm from "./EventCheckInForm";

export default function EventsForm(usertype) {
    const navigate = useNavigate();

    const events = [{
        id: "meettheteam",
        name: "Meet the Team",
        timelocation: "7:30 - 9pm | February 10th | Room W20-201",
        description: "Meet current members of MCG and learn more about MCG's recruitment process during our first recruitment event of the semester."
    },
    {
        id: "pdpanel",
        name: "Professional Development Panel",
        timelocation: "7:30 - 9pm | February 11th | Room 2-190",
        description: "Hear from current members about their professional experiences in various industries and the role MCG has played in developing their careers."
    },
    {
        id: "deipanel",
        name: "DEI Panel",
        timelocation: "7:30 - 9pm | February 12th | Room 2-190",
        description: "Hear from current women and BIPOC within MCG about their professional experiences and MCG's efforts to create a more inclusive environment."
    },
    {
        id: "resumereview",
        name: "Resume Review",
        timelocation: " 7:30 - 9pm | February 13th | Room 2-190",
        description: "Come work on your resume with the help of current MCG consultants who have landed offers at top consulting, finance, and tech companies."
    },
    {
        id: "cheesecakesocial",
        name: "Cheesecake Social",
        timelocation: "7:30 - 9pm | February 15th | By Invitation",
        description: "Join us for a night of cheesecake and games and learn more about the MCG community, social events, and the work our members do in a casual setting."
    },
    {
        id: "caseworkshop",
        name: "Case Workshop",
        timelocation: "12:30 - 2pm | February 16th | By Invitation",
        description: "Learn more about consulting and prepare for MCG interviews by working through a mock case with MCG consultants."
    }
    ]

    return (
        <div className="flex flex-wrap gap-8 px-10 justify-center">
            {events.map((event) => (
                <EventCheckInForm key={event.id} event={event} />))}
        </div>
    );
}
