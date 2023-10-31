import { yupResolver } from "@hookform/resolvers/yup";
import { motion } from "framer-motion";
import moment from "moment";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

// Components
import Button from "../components/Button";
import StepsIndicator from "../components/CreateMeeting/StepsIndicator";
import Heading from "../components/Heading";
import Input from "../components/Input";
import Timepicker from "../components/Timepicker";
import Title from "../components/Title";

import axios from "axios";
import { as } from "vitest/dist/reporters-5f784f42";

export default function CreateMeeting() {
  // Steps
  const [prevStep, setPrevStep] = useState(0);
  const [currStep, setCurrStep] = useState(0);
  const delta = currStep - prevStep;

  // Name
  const [meetDetails, setMeetDetails] = useState({
    name: "" as string,
    length: "" as string,
    place: "" as string,
    link: "" as string,
  });
  const [meetingName, setMeetingName] = useState("");

  // Time
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [timeError, setTimeError] = useState(false);
  const [timeErrorText, setTimeErrorText] = useState("");

  const handleStartTimeChange = (e: { target: { value: string } }) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: { target: { value: string } }) => {
    setEndTime(e.target.value);
  };

  // CALENDAR
  // Selecting dates
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [dateError, setDateError] = useState(false);

  const toggleTimecell = (date: number) => {
    if (selectedDates.includes(date)) {
      if (!selectionMode) {
        setSelectedDates(selectedDates.filter((d) => d !== date));
      }
      if (!isMouseDown) {
        setSelectionMode(false);
        setSelectedDates(selectedDates.filter((d) => d !== date));
        setIsMouseDown(true);
      }
    } else {
      if (selectionMode) {
        setSelectedDates([...selectedDates, date]);
      }
      if (!isMouseDown) {
        setSelectionMode(true);
        setSelectedDates([...selectedDates, date]);
        setIsMouseDown(true);
      }
    }
  };

  const handleMouseOver = (date: number) => {
    if (isMouseDown) {
      toggleTimecell(date);
    }
  };

  // Rendering calerdar
  const showCalendar = (month: number, year: number) => {
    var firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) {
      firstDay = 7;
    }
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const daysUntilFirstMonday = (7 - ((firstDay + 6) % 7)) % 7;
    const remainingDays = daysInMonth - daysUntilFirstMonday;
    const weeksInMonth = 1 + Math.ceil(remainingDays / 7);

    let tableRows = [];
    let day = 1;
    let e = 0;

    const dateNow = new Date();
    for (let i = 0; i < weeksInMonth; i++) {
      let tableCells = [];
      for (let j = 0; j < 7; j++) {
        const date = moment
          .utc()
          .date(day)
          .month(month)
          .year(year)
          .startOf("day")
          .valueOf();
        if (day <= daysInMonth && (i > 0 || j >= firstDay - 1)) {
          tableCells.push(
            <td
              key={"d" + day}
              data-date={date}
              onMouseDown={() => toggleTimecell(date)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseOver={() => handleMouseOver(date)}
              className={`h-10 w-10 font-medium text-center cursor-pointer ${
                selectedDates.includes(date)
                  ? `${
                      dateNow.getDate() == day &&
                      dateNow.getMonth() == month &&
                      dateNow.getFullYear() == year
                        ? "border border-2 border-dark bg-primary text-light rounded-lg selected"
                        : "bg-primary rounded-lg text-light selected"
                    }`
                  : `${
                      dateNow.getDate() == day &&
                      dateNow.getMonth() == month &&
                      dateNow.getFullYear() == year
                        ? "border border-2 border-primary rounded-lg"
                        : ""
                    }`
              }`}
            >
              {day}
            </td>
          );
          day++;
        } else {
          tableCells.push(<td key={"e" + e}></td>);
          e++;
        }
      }
      tableRows.push(<tr key={"w" + i}>{tableCells}</tr>);
    }

    return tableRows;
  };

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  const prevMonth = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Pażdziernik",
    "Listopad",
    "Grudzień",
  ];

  const daysName = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  // Create meeting
  const navigate = useNavigate();
  const createMeeting: SubmitHandler<Inputs> = async () => {
    validateTime();
    validateDate();
    if (validateTime() && validateDate()) {
      axios
        .post(import.meta.env.VITE_SERVER_URL + "/meet/new", {
          meetName: meetDetails?.name,
          dates: selectedDates,
          startTime: startTime,
          endTime: endTime,
        })
        .then(function (response) {
          const meetId = response.data.newMeet.appointmentId;
          const meetUrl = `/meet/${meetId}`;
          navigate(meetUrl);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  // VALIDATION
  // Date validation
  const validateDate = () => {
    if (selectedDates.length < 1) {
      setDateError(true);
      return false;
    } else {
      setDateError(false);
      return true;
    }
  };

  // Time validation
  const validateTime = () => {
    const now = new Date();
    const nowDateTime = now.toISOString();
    const nowDate = nowDateTime.split("T")[0];
    const startTimeConverted = new Date(nowDate + "T" + startTime);
    const endTimeConverted = new Date(nowDate + "T" + endTime);

    if (startTimeConverted >= endTimeConverted) {
      setTimeError(true);
      setTimeErrorText(
        "Godzina zakończenia musi być późniejsza niż rozpoczęcia."
      );
      return false;
    } else {
      setTimeError(false);
      setTimeErrorText("");
      return true;
    }
  };

  // Form validation
  const formSchema = yup.object().shape({
    meeting__name: yup
      .string()
      .required("Nazwa spotkania jest wymagana.")
      .min(4, "Nazwa spotkania musi mieć co najmniej 4 znaki.")
      .max(50, "Nazwa spotkania może mieć maksymalnie 50 znaków."),
  });

  type Inputs = {
    meeting__name: string;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(formSchema) });

  const stepsInfo = [
    { title: "Szczegóły spotkania" },
    { title: "Wybierz datę spotkania" },
    { title: "Wybierz godzinę spotkania" },
  ];

  const next = () => {
    if (currStep < stepsInfo.length - 1) {
      // if (currStep === stepsInfo.length - 2) {
      //   handleSubmit(createMeeting);
      // }
      setPrevStep(currStep);
      setCurrStep(currStep + 1);
    }
  };

  const prev = () => {
    if (currStep > 0) {
      setPrevStep(currStep);
      setCurrStep(currStep - 1);
    }
  };

  return (
    <main className="flex flex-col px-5 py-10 md:p-10 mt-20 lg:m-0 justify-center">
      <Title text="Utwórz nowe spotkanie" />
      <StepsIndicator steps={4} stepsData={stepsInfo} currIndex={currStep} />
      <form
        id="create-meeting-form"
        className="flex flex-col justify-center h-[400px]"
      >
        <div className="self-center">
          {/* Meeting details */}
          {currStep === 0 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Input
                label="Nazwa spotkania"
                type="text"
                id="meeting__name"
                register={register}
                errorText={errors.meeting__name?.message?.toString()}
                error={errors.meeting__name ? true : false}
                placeholder="📝 Nazwa spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    name: e.target.value.toString(),
                  })
                }
              />
              <Input
                label="Długość spotkania"
                type="text"
                id="meeting__length"
                register={register}
                placeholder="⌚ Długość spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    length: e.target.value.toString(),
                  })
                }
              />
              <Input
                label="Miejsce spotkania"
                type="text"
                id="meeting__place"
                register={register}
                errorText={errors.meeting__name?.message?.toString()}
                error={errors.meeting__name ? true : false}
                placeholder="🏢 Miejsce spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    place: e.target.value.toString(),
                  })
                }
              />
              <Input
                label="Link do spotkania"
                type="text"
                id="meeting__link"
                register={register}
                errorText={errors.meeting__name?.message?.toString()}
                error={errors.meeting__name ? true : false}
                placeholder="🔗 Link do spotkania"
                onChange={(e: {
                  target: { value: React.SetStateAction<string> };
                }) =>
                  setMeetDetails({
                    ...meetDetails,
                    link: e.target.value.toString(),
                  })
                }
              />
            </motion.div>
          )}

          {/* Choose date */}
          {currStep === 1 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col self-center">
                <table
                  className={`date__selection--table border border-2 border-separate border-spacing-0.5 box-content p-2 select-none w-[296px] ${
                    dateError ? "rounded-lg border-red" : "border-transparent"
                  }`}
                >
                  <thead>
                    <tr>
                      <th colSpan={7}>
                        <div className="flex justify-between items-center">
                          <button
                            onClick={prevMonth}
                            className="h-10 w-10 rounded-lg bg-light hover:bg-light-hover active:bg-light-active shadow-md transition-colors flex justify-center items-center"
                          >
                            <IoChevronBack />
                          </button>
                          <span className="text-dark">
                            {monthName[month] + " " + year}
                          </span>
                          <button
                            onClick={nextMonth}
                            className="h-10 w-10 rounded-lg bg-light hover:bg-light-hover active:bg-light-active shadow-md transition-colors flex justify-center items-center"
                          >
                            <IoChevronForward />
                          </button>
                        </div>
                      </th>
                    </tr>
                    <tr>
                      {daysName.map((day) => (
                        <th className="font-medium text-gray">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{showCalendar(month, year)}</tbody>
                </table>
                <p className="text-sm relative mt-2 text-red font-medium">
                  {dateError ? "Wybierz datę spotkania." : ""}
                </p>
              </div>
            </motion.div>
          )}

          {/* Choose time */}
          {currStep === 2 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div>
                <div className="flex justify-center mb-5">
                  <div className="flex flex-col justify-center items-center w-fit">
                    <div className="self-center">
                      <Timepicker
                        from={true}
                        onChange={handleStartTimeChange}
                      />
                      <span className="m-4"> - </span>
                      <Timepicker from={false} onChange={handleEndTimeChange} />
                    </div>
                  </div>
                </div>
                <p className="text-sm relative mt-2 text-red font-medium w-11/12 whitespace-pre-wrap">
                  {timeError ? timeErrorText : ""}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {currStep === 3 && <Button text="Utwórz spotkanie" />}
      </form>
      {/* Navigation */}
      {currStep < 3 && (
        <div className="self-center">
          <Button
            text="Wstecz"
            onClick={prev}
            className="mr-10"
            disabled={currStep === 0}
          />
          <Button text="Dalej" onClick={next} />
        </div>
      )}
    </main>
  );
}
