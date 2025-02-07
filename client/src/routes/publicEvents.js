import React from 'react';
import PublicHeader from '../components/headers/PublicHeader';
import { Link } from 'react-router-dom';

export default function PublicEvents() {
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
    }]
    return (
        <div>
            <div>
                <PublicHeader />

            </div>

            <div className="bg-gray-50 ">
                <div className='text-center'>
                    <h1 className="pt-8 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                        Welcome to MCG's Spring 2025 Recruitment Cycle Events
                    </h1>
                    <h3 className='my-4'>Please <Link className='hover:underline' to="/login">login</Link> to check-in to events</h3>
                </div>


                <div className="flex flex-wrap gap-8 px-10 justify-center">
                    {events.map((event) => (
                        <div key={event.id} className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow ">
                            <div className="">
                                <h5 className=" text-center mb-2 text-2xl font-bold tracking-tight text-gray-900 ">{event.name}</h5>
                                <p className=" text-center mb-3 font-normal text-gray-700">{event.timelocation}</p>
                                <p className="mb-3 font-normal text-gray-700 ">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
