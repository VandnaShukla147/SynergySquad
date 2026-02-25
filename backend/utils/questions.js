const demoQuestions = [
    {
        questionId: 1,
        text: "Q1. Which token will be used?",
        type: "mcq",
        questionImage: "/q1.png",
        options: [
            "manualToken",
            "autoToken",
            "Both",
            "None"
        ],
        correctAnswer: "autoToken",
        justification: "The autoToken is used because it overrides the manually set token in the request specification."
    },
    {
        questionId: 2,
        text: "Q2. What happens if you do not specify a content type while sending a POST request with a JSON body?",
        type: "mcq",
        options: [
            "The request always fails",
            "Rest Assured automatically assumes XML",
            "The server may not correctly interpret the request body",
            "Rest Assured throws a compilation error"
        ],
        correctAnswer: "The server may not correctly interpret the request body",
        justification: "Without specifying the content type, the server has no way to know the format of the request body. It may misinterpret the JSON data, leading to unexpected behavior or errors."
    },
    {
        questionId: 3,
        text: "Q3. A reusable RequestSpecification is created with headers and base URI. However, one test modifies headers inside given(). What could be a potential issue?",
        type: "mcq",
        options: [
            "Rest Assured ignores new headers",
            "Headers from specification are permanently modified for all tests",
            "The request will fail automatically",
            "The modified headers apply only to that specific request"
        ],
        correctAnswer: "The modified headers apply only to that specific request",
        justification: "When you modify headers inside given(), the changes are scoped to that specific request only. The original RequestSpecification remains unchanged for other tests."
    },
    {
        questionId: 4,
        text: "Q4. What is true about this?",
        type: "mcq",
        questionImage: "/q4.png",
        options: [
            "Second validation overwrites first",
            "Only first then() works",
            "Both validations are executed independently",
            "It causes IllegalStateException"
        ],
        correctAnswer: "Both validations are executed independently",
        justification: "In Rest Assured, multiple then() validations are chained and executed independently. Both assertions will be checked against the response."
    },
    {
        questionId: 5,
        text: "Q5. The following class is needed to be deserialized:-",
        type: "mcq",
        questionImage: "/q5.png",
        optionLabel: "Which fix should be chosen:-",
        optionType: "image",
        options: [
            "A",
            "B",
            "C",
            "D"
        ],
        optionImages: ["/q5a.png", "/q5b.png", "/q5c.png", "/q5d.png"],
        correctAnswer: "B",
        justification: "Option B correctly demonstrates the expected fix for deserialization."
    },
    {
        questionId: 6,
        text: "Q6. Which among the following should be used for deserialization even if extra fields are added in the response?",
        type: "mcq",
        optionType: "image",
        options: [
            "A",
            "B",
            "C",
            "D"
        ],
        optionImages: ["/q6a.jpg", "/q6b.png", "/q6c.png", "/q6d.png"],
        correctAnswer: "B",
        justification: "This configuration allows deserialization to succeed even when the response contains fields not mapped in the POJO."
    },
    {
        questionId: 7,
        text: "Q7. Go through the following code snippet:- If TestNG is running in parallel mode, what is the most likely issue with this implementation?",
        type: "mcq",
        questionImage: "/q7.png",
        options: [
            "Nothing, this improves performance in parallel execution",
            "Retry logic becomes automatically thread-safe because variables are static",
            "Tests may skip retries unpredictably due to shared state across threads",
            "It only increases memory usage but works correctly"
        ],
        correctAnswer: "Tests may skip retries unpredictably due to shared state across threads",
        justification: "Static count is shared across all threads. If testOne increments count to 2, testTwo may not get retries. This causes race conditions and unpredictable behavior. In parallel automation, retry logic must be thread-safe."
    },
    {
        questionId: 8,
        text: "Q8. Which code snippet best demonstrates reusable and readable API testing in RestAssured using SpecBuilder, dynamic parameters, and core syntax?",
        type: "mcq",
        optionType: "image",
        options: [
            "A",
            "B",
            "C",
            "D"
        ],
        optionImages: ["/q8a.png", "/q8b.png", "/q8c.png", "/q8d.png"],
        correctAnswer: "A",
        justification: "Option A uses SpecBuilder for request and response, dynamic parameters, and core RestAssured syntax, making tests reusable and readable."
    },
    {
        questionId: 9,
        text: "Q9. How many total executions will happen?",
        type: "mcq",
        questionImages: ["/q91.png", "/q92.png"],
        options: [
            "testOne = 3 times, testTwo = 2 times",
            "testOne = 3 times, testTwo = 1 time",
            "testOne = 2 times, testTwo = 2 times",
            "testOne = 3 times, testTwo = 3 times"
        ],
        correctAnswer: "testOne = 3 times, testTwo = 3 times",
        justification: "Each test method gets its own instance of RetryAnalyzer. TestNG creates a new RetryAnalyzer object per test method, so count resets for each test. Each test gets 1 original run + 2 retries = 3 executions."
    },
    {
        questionId: 10,
        text: "Q10. You want to implement a negative test for the /update endpoint, ensuring that a 403 Forbidden is returned when a user without proper permission tries to update data. Which is the best approach?",
        type: "mcq",
        optionType: "image",
        options: [
            "A",
            "B",
            "C",
            "D"
        ],
        optionImages: ["/q10a.png", "/q10b.png", "/q10c.png", "/q10d.png"],
        correctAnswer: "A",
        justification: "Option A provides the most complete negative test: sends an invalid token, checks the correct 403 status code, AND validates the error message in the response body."
    },
    {
        questionId: 11,
        text: "Q11. Which token will be used?",
        type: "mcq",
        questionImage: "/q11.png",
        options: [
            "token1",
            "token2",
            "Both",
            "Random"
        ],
        correctAnswer: "token2",
        justification: "Explicit header in request overrides spec header."
    },
    {
        questionId: 12,
        text: "Q12. What happens?",
        type: "mcq",
        questionImage: "/q12.jpg",
        options: [
            "Pass",
            "200 overrides 201",
            "201 overrides 200",
            "Fail"
        ],
        correctAnswer: "Fail",
        justification: "Both validations apply. Since status is 201, spec expects 200 → fails."
    },
    {
        questionId: 13,
        text: "Q13. We want to include the null values that are skipped by default. What could be the solution?",
        type: "mcq",
        optionType: "image",
        options: [
            "A",
            "B",
            "C",
            "D"
        ],
        optionImages: ["/q13a.png", "/q13b.png", "/q13c.png", "/q13d.png"],
        correctAnswer: "B",
        justification: "This configuration includes null values that Jackson skips by default during serialization."
    },
    {
        questionId: 14,
        text: "Q14. What is the issue with the code as the response is missing some fields?",
        type: "mcq",
        questionImage: "/q14.jpg",
        options: [
            "The pojo class is not having any setters for the data fields",
            "The missing field was not a class instance variable so they are not included",
            "Missing @JsonInclude for the email field which is missing",
            "The Email field is null and Jackson is ignoring the missing field as nulls are ignored"
        ],
        correctAnswer: "The pojo class is not having any setters for the data fields",
        justification: "Without setters, Jackson cannot populate the POJO fields during deserialization, causing the response fields to be missing."
    },
    {
        questionId: 15,
        text: "Q15. Fill in the blank: To ensure that a reusable RequestSpecification is not modified by individual tests, you should create it using the __________ method of RequestSpecBuilder each time, instead of sharing the same instance.",
        type: "fill",
        correctAnswer: "build()",
        justification: "The build() method of RequestSpecBuilder creates a new RequestSpecification instance each time, preventing shared state mutation across tests."
    }
];

module.exports = demoQuestions;
