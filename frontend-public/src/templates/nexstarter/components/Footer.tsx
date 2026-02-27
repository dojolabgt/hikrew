
export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Construido por <a href="#" className="font-medium underline underline-offset-4">Pablo Lacán</a>.
                    El código fuente está disponible en <a href="#" className="font-medium underline underline-offset-4">GitHub</a>.
                </p>
            </div>
        </footer>
    )
}
