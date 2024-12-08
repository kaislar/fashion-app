ENV_FILE_PATH := .env
-include $(ENV_FILE_PATH) # keep the '-' to ignore this file if it doesn't exist.(Used in gitlab ci)

# Colors
GREEN=\033[0;32m
YELLOW=\033[0;33m
NC=\033[0m

NVM_USE := export NVM_DIR="$$HOME/.nvm" && . "$$NVM_DIR/nvm.sh" && nvm use
UV := "$$HOME/.local/bin/uv" # keep the quotes incase the path contains spaces

# installation
install-uv:
	@echo "${YELLOW}=========> installing uv ${NC}"
	@if [ -f $(UV) ]; then \
		echo "${GREEN}uv exists at $(UV) ${NC}"; \
		$(UV) self update; \
	else \
	     echo "${YELLOW}Installing uv${NC}"; \
		 curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="$$HOME/.local/bin" sh ; \
	fi

install-prod:install-uv
	@echo "${YELLOW}=========> Installing dependencies...${NC}"
	@$(UV) sync --no-group dev --no-group docs
	@echo "${GREEN}Dependencies installed.${NC}"

install-dev:install-uv
	@echo "${YELLOW}=========> Installing dependencies...\n  \
	 Development dependencies (dev & docs) will be installed by default in install-dev.${NC}"
	@$(UV) sync
	@echo "${GREEN}Dependencies installed.${NC}"

STREAMLIT_PORT ?= 8501
run-frontend:
	@echo "Running frontend"
	cd src; $(UV) run streamlit run main_frontend.py --server.port $(STREAMLIT_PORT) --server.headless True;

run-backend:
	@echo "Running backend"
	cd src; $(UV) run main_backend.py;

run-app:
	make frontend backend -j2

pre-commit-install:
	@echo "${YELLOW}=========> Installing pre-commit...${NC}"
	$(UV) run pre-commit install
pre-commit:
	@echo "${YELLOW}=========> Running pre-commit...${NC}"
	$(UV) run pre-commit run --all-files

###### NVM & npm packages ########
install-nvm:
	echo "${YELLOW}=========> Installing Evaluation app $(NC)"

	@if [ -d "$$HOME/.nvm" ]; then \
		echo "${YELLOW}NVM is already installed.${NC}"; \
		$(NVM_USE) --version; \
	else \
		echo "${YELLOW}=========> Installing NVM...${NC}"; \
		curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash; \
	fi

	# Activate NVM (makefile runs in a subshell, always use this)
	@echo "${YELLOW}Restart your terminal to use nvm.  If you are on MacOS, run nvm ls, if there is no node installed, run nvm install ${NC}"
	@bash -c ". $$HOME/.nvm/nvm.sh; nvm install"

install-npm-dependencies: install-nvm
	@echo "${YELLOW}=========> Installing npm packages...${NC}"
	@$(NVM_USE) && npm ci
	@echo "${GREEN} Installation complete ${NC}"


#check-npm-dependencies:
#	@echo "${YELLOW}Checking npm dependencies...${NC}" && \
#	$(NVM_USE) && npm outdated || true # since the - flag is not working and we need to ignore the outdated return code
#	@echo "${GREEN}If there are outdated dependencies, update the package.json and run ${YELLOW}npm install${NC}"


####### local CI / CD ########
# uv caching :
prune-uv:
	@echo "${YELLOW}=========> Prune uv cache...${NC}"
	@$(UV) cache prune
# clean uv caching
clean-uv-cache:
	@echo "${YELLOW}=========> Cleaning uv cache...${NC}"
	@$(UV) cache clean

# Github actions locally
install-act:
	@echo "${YELLOW}=========> Installing github actions act to test locally${NC}"
	curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | bash
	@echo -e "${YELLOW}Github act version is :"
	@./bin/act --version

act:
	@echo "${YELLOW}Running Github Actions locally...${NC}"
	@./bin/act --env-file .env --secret-file .secrets


# Gitlab CI locally
GITLAB_CI_LOCAL_CMD=./node_modules/.bin/gitlab-ci-local
install-gitlab-ci-local: install-npm-packages
    # gitlab-ci-local is an npm package and is installed within the install-evaluation-app step
	@echo "${GREEN}Installed gitlab-ci-local${NC}"
	@echo "${GREEN}gitlab-ci-local version is $$($(NVM_USE) > /dev/null && $(GITLAB_CI_LOCAL_CMD) --version | tail -n 1) ${NC}"
gitlab-ci-local:
	@echo "${YELLOW}Running Gitlab Runner locally...${NC}"
	@$(NVM_USE) && $(GITLAB_CI_LOCAL_CMD) --network=host --variables-file .env

# clear GitHub and Gitlab CI local caches
clear_ci_cache:
	@echo "${YELLOW}Clearing CI cache...${NC}"
	@echo "${YELLOW}Clearing gitlab ci local cache...${NC}"
	rm -rf .gitlab-ci-local/cache
	@echo "${YELLOW}Clearing Github ACT local cache...${NC}"
	rm -rf ~/.cache/act ~/.cache/actcache


########## evaluation framework ###########
PROMPTFOO_CMD=.././node_modules/.bin/promptfoo
install-promptfoo:install-nvm
	@echo "${YELLOW}=========> Installing promptfoo...${NC}"
	@echo "${GREEN}Promptfoo version is $$($(NVM_USE) > /dev/null && cd src && $(PROMPTFOO_CMD) --version | tail -n 1) ${NC}"

# promptfoo eval and metrics
eval:
	# requires export of environment variables
	@echo "${YELLOW}Running evaluation...${NC}"
	@$(NVM_USE) && \
	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) eval --config evaluation/configs/config_simple.yaml

eval-env-file:
	# requires .env file
	@echo "${YELLOW}Running evaluation, reading variables from .env file...${NC}"
	@#$(NVM_USE) && \
#	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) eval --no-cache --env-file ../.env --config evaluation/configs/config_simple.yaml
#	@$(NVM_USE) && \
#	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) eval --no-cache --env-file ../.env --config evaluation/configs/config_json.yaml
	@$(NVM_USE) && \
	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) eval --no-cache --env-file ../.env --config evaluation/configs/config_simple.yaml
eval-view:
	@$(NVM_USE) ; \
	cd src && $(PROMPTFOO_CMD) view

eval-share:
	@$(NVM_USE) ; \
	cd src && $(PROMPTFOO_CMD) share

# promptfoo redteam
redteam:
	# requires export of environment variables
	@echo "${YELLOW}Running redteaming.${NC}"
	@$(NVM_USE) && \
	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) redteam run --config evaluation/configs/redteam_config.yaml


redteam-env-file:
	# requires .env file
	@echo "${YELLOW}Running redteaming.${NC}"
#	@$(NVM_USE) && \
#	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) redteam run --env-file ../.env --config evaluation/configs/redteam_config.yaml

	@$(NVM_USE) && \
	cd src && PYTHONPATH='.' $(PROMPTFOO_CMD) redteam run --force --env-file ../.env --config evaluation/configs/redteam_config.yaml --verbose

redteam-view:
# requires .env file
	@echo "${YELLOW}Running redteaming.${NC}"
	@$(NVM_USE) && \
	cd src && $(PROMPTFOO_CMD) redteam report

######### Langfuse




######## Ollamazure
install-ollama:
	@echo "${YELLOW}=========> Installing ollama first...${NC}"
	@if [ "$$(uname)" = "Darwin" ]; then \
	    echo "Detected macOS. Installing Ollama with Homebrew..."; \
	    brew install --cask ollama; \
	elif [ "$$(uname)" = "Linux" ]; then \
	    echo "Detected Linux. Installing Ollama with curl..."; \
	    curl -fsSL https://ollama.com/install.sh | sh; \
	else \
	    echo "Unsupported OS. Please install Ollama manually."; \
	    exit 1; \
	fi

download-ollama-model: install-ollama
	@echo "Starting Ollama in the background..."
	@echo "${YELLOW}Downloading local model ${OLLAMA_MODEL_NAME} and ${OLLAMA_EMBEDDING_MODEL_NAME} ...${NC}"
	@ollama serve &
	@sleep 5
	@ollama pull ${OLLAMA_EMBEDDING_MODEL_NAME}
	@ollama pull ${OLLAMA_MODEL_NAME}

run-ollama:
	@echo "${YELLOW}Running ollama...${NC}"
	@ollama serve

# replace the model with the env variable
OLLAMAZURE_CMD=./node_modules/.bin/ollamazure
install-ollamazure:install-nvm install-ollama
	@echo "${YELLOW}=========> Installing ollamazure...${NC}"
	@echo "${GREEN}ollamazure version is $$($(NVM_USE) > /dev/null && $(OLLAMAZURE_CMD) --version | tail -n 1) ${NC}"

run-ollamazure:
	@echo "${YELLOW}Running ollama...${NC}"
	@ollama serve &
	@echo "${YELLOW}Running ollamazure...${NC}"
	@#$(NVM_USE) && $(OLLAMAZURE_CMD) --model ${OLLAMA_MODEL_NAME} --embeddings ${OLLAMA_EMBEDDING_MODEL_NAME}
	@$(NVM_USE) && $(OLLAMAZURE_CMD) --model phi3:3.8b-mini-4k-instruct-q4_K_M --embeddings all-minilm:l6-v2




######## Tests ########
test:
    # pytest runs from the root directory
	@echo "${YELLOW}Running tests...${NC}"
	@$(UV) run pytest tests

test-ollama:
	curl -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d '{"model": "phi3:3.8b-mini-4k-instruct-q4_K_M", "prompt": "Hello", "stream": false}'

test-llm-client:
	# llm that generate answers (used in chat, rag and promptfoo)
	@echo "${YELLOW}=========> Testing LLM client...${NC}"
	@$(UV) run pytest tests/test_llm_endpoint.py -k test_llm_client --disable-warnings


test-llmaaj-client:
    # stands for llm as a judge client, used in promptfoo and ragas
	@echo "${YELLOW}=========> Testing LLM As a judge client...${NC}"
	@$(UV) run pytest tests/test_llm_endpoint.py -k test_llmaaj_client --disable-warnings


run-langfuse:
	@echo "${YELLOW}Running langfuse...${NC}"
	@if [ "$$(uname)" = "Darwin" ]; then \
	    echo "Detected macOS running postgresql with Homebrew..."; \
	    colima start
	    brew services start postgresql@17; \

	elif [ "$$(uname)" = "Linux" ]; then \
	    echo "Detected Linux running postgresql with systemctl..."; \
	else \
	    echo "Unsupported OS. Please start postgres manually."; \
	    exit 1; \
	fi



# This build the documentation based on current code 'src/' and 'docs/' directories
# This is to run the documentation locally to see how it looks
deploy-doc-local:
	@echo "${YELLOW}Deploying documentation locally...${NC}"
	@$(UV) run mkdocs build && $(UV) run mkdocs serve

# Deploy it to the gh-pages branch in your GitHub repository (you need to setup the GitHub Pages in github settings to use the gh-pages branch)
deploy-doc-gh:
	@echo "${YELLOW}Deploying documentation in github actions..${NC}"
	@$(UV) run mkdocs build && $(UV) run mkdocs gh-deploy
