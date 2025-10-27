export type QuizzDataType = {
    settings: {
        numQuestions: number
        difficulty: string
    }
    _id: string
    ownerId: string
    materialId: {
        _id: string
        ownerId: string
        title: string
        type: string
        filePath: string
        processedContent: string
        createdAt: string
        updatedAt: string
        __v: number
    }
    title: string
    questions: Array<{
        question: string
        type: string
        options: Array<string>
        answer: string
        _id: string
    }>
    createdAt: string
    updatedAt: string
    __v: number
}

export type RequestCreateQuizz = {
    materialIds: string[]
    settings: {
        questionConfigs: Array<{
            type: "mcq" | "truefalse" | "fillblank"
            count: number
            difficulty: "easy" | "medium" | "hard"
        }>
        customTitle: string
        focusAreas?: Array<string>
        customInstructions?: string
    }
}